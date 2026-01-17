import jwt from 'jsonwebtoken'
import axios from 'axios'
import { env } from './env'

const ZOOM_API_KEY = env.ZOOM_API_KEY
const ZOOM_API_SECRET = env.ZOOM_API_SECRET
const ZOOM_ACCOUNT_ID = env.ZOOM_ACCOUNT_ID
const ZOOM_BASE_URL = 'https://api.zoom.us/v2'

// Debug logging (print once in dev or when ZOOM_DEBUG=true)
const shouldDebugZoom = process.env.ZOOM_DEBUG === 'true' || process.env.NODE_ENV !== 'production'
if (shouldDebugZoom) {
  ;(global as any).__zoomLogged__ = (global as any).__zoomLogged__ || false
  if (!(global as any).__zoomLogged__) {
    ;(global as any).__zoomLogged__ = true
    console.log('Zoom Config:', {
      hasApiKey: !!ZOOM_API_KEY,
      hasApiSecret: !!ZOOM_API_SECRET,
      hasAccountId: !!ZOOM_ACCOUNT_ID,
      accountId: ZOOM_ACCOUNT_ID ? ZOOM_ACCOUNT_ID.substring(0, 5) + '...' : 'undefined'
    })
  }
}

// Test mode flag - set to true to bypass Zoom API for testing
const ZOOM_TEST_MODE = process.env.ZOOM_TEST_MODE === 'true'

interface ZoomMeetingResponse {
  id: string
  host_id: string
  topic: string
  type: number
  start_time: string
  duration: number
  timezone: string
  agenda: string
  start_url: string
  join_url: string
  password: string
}

interface CreateMeetingParams {
  topic: string
  type: number
  start_time: string
  duration: number
  agenda?: string
  password?: string
  settings?: {
    host_video?: boolean
    participant_video?: boolean
    cn_meeting?: boolean
    in_meeting?: boolean
    join_before_host?: boolean
    mute_upon_entry?: boolean
    watermark?: boolean
    use_pmi?: boolean
    approval_type?: number
    auto_recording?: string
    enforce_login?: boolean
    enforce_login_domains?: string
    alternative_hosts?: string
    close_registration?: boolean
    waiting_room?: boolean
  }
}

export class ZoomAPI {
  private accessToken: string | null = null
  private tokenExpiry: number = 0

  private generateJWT(): string {
    const payload = {
      iss: ZOOM_API_KEY,
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      iat: Math.floor(Date.now() / 1000), // issued at
      aud: 'zoom'
    }
    
    return jwt.sign(payload, ZOOM_API_SECRET || 'placeholder', { algorithm: 'HS256' })
  }

  private async getAccessToken(): Promise<string> {
    // Check if we have a valid token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken!
    }

    // If we have Account ID, use Server-to-Server OAuth
    if (ZOOM_ACCOUNT_ID && ZOOM_ACCOUNT_ID.length > 0) {
      console.log('Using Server-to-Server OAuth authentication...')
      try {
        const response = await axios.post('https://zoom.us/oauth/token', null, {
          params: {
            grant_type: 'account_credentials',
            account_id: ZOOM_ACCOUNT_ID
          },
          auth: {
            username: ZOOM_API_KEY || 'placeholder',
            password: ZOOM_API_SECRET || 'placeholder'
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })

        console.log('OAuth token received successfully')
        this.accessToken = response.data.access_token
        this.tokenExpiry = Date.now() + (response.data.expires_in * 1000) - 60000 // Subtract 1 minute for safety

        return this.accessToken!
      } catch (error: any) {
        console.error('Error getting Zoom OAuth token:', error.response?.data || error.message)
        console.log('OAuth failed, falling back to JWT authentication...')
        // Fall back to JWT if OAuth fails
        return this.generateJWT()
      }
    } else {
      // Use JWT authentication if no Account ID
      console.log('Using JWT authentication (no Account ID provided)')
      return this.generateJWT()
    }
  }

  private async getHeaders() {
    const token = await this.getAccessToken()
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  async createMeeting(params: CreateMeetingParams): Promise<ZoomMeetingResponse> {
    // Test mode - return mock data
    if (ZOOM_TEST_MODE) {
      console.log('ZOOM_TEST_MODE: Creating mock meeting...')
      return {
        id: Math.floor(Math.random() * 1000000000).toString(),
        host_id: 'mock-host',
        topic: params.topic,
        type: 2,
        start_time: params.start_time || new Date().toISOString(),
        duration: params.duration || 60,
        timezone: 'UTC',
        agenda: params.agenda || '',
        start_url: `https://zoom.us/s/mock-start-${Date.now()}`,
        join_url: `https://zoom.us/j/mock-join-${Date.now()}`,
        password: 'mock123'
      }
    }

    try {
      const headers = await this.getHeaders()
      const response = await axios.post(
        `${ZOOM_BASE_URL}/users/me/meetings`,
        params,
        { headers }
      )
      
      return response.data
    } catch (error: any) {
      console.error('Error creating Zoom meeting:', error.response?.data || error.message)
      
      // If scope error and we have Account ID, try JWT fallback
      if (error.response?.data?.code === 4711 && ZOOM_ACCOUNT_ID) {
        console.log('Scope error detected, trying JWT fallback...')
        try {
          const jwtHeaders = {
            'Authorization': `Bearer ${this.generateJWT()}`,
            'Content-Type': 'application/json'
          }
          const response = await axios.post(
            `${ZOOM_BASE_URL}/users/me/meetings`,
            params,
            { headers: jwtHeaders }
          )
          console.log('JWT fallback successful!')
          return response.data
        } catch (jwtError: any) {
          console.error('JWT fallback also failed:', jwtError.response?.data || jwtError.message)
        }
      }
      
      if (error.response?.status === 401) {
        throw new Error('Zoom API authentication failed. Please check your API credentials.')
      }
      if (error.response?.status === 429) {
        throw new Error('Zoom API rate limit exceeded. Please try again later.')
      }
      throw new Error(`Failed to create Zoom meeting: ${error.response?.data?.message || error.message}`)
    }
  }

  async getMeeting(meetingId: string): Promise<ZoomMeetingResponse> {
    try {
      const headers = await this.getHeaders()
      const response = await axios.get(
        `${ZOOM_BASE_URL}/meetings/${meetingId}`,
        { headers }
      )
      
      return response.data
    } catch (error) {
      console.error('Error fetching Zoom meeting:', error)
      throw new Error('Failed to fetch Zoom meeting')
    }
  }

  async updateMeeting(meetingId: string, params: Partial<CreateMeetingParams>): Promise<void> {
    try {
      const headers = await this.getHeaders()
      await axios.patch(
        `${ZOOM_BASE_URL}/meetings/${meetingId}`,
        params,
        { headers }
      )
    } catch (error) {
      console.error('Error updating Zoom meeting:', error)
      throw new Error('Failed to update Zoom meeting')
    }
  }

  async deleteMeeting(meetingId: string): Promise<void> {
    // If in test mode, just log and return (mock meetings don't need deletion)
    if (ZOOM_TEST_MODE) {
      console.log('ZOOM_TEST_MODE: Skipping mock meeting deletion')
      return
    }

    try {
      const headers = await this.getHeaders()
      await axios.delete(
        `${ZOOM_BASE_URL}/meetings/${meetingId}`,
        { headers }
      )
    } catch (error: any) {
      // If meeting doesn't exist (404), that's fine - it's already deleted
      if (error.response?.status === 404) {
        console.log('Zoom meeting already deleted or not found:', meetingId)
        return
      }
      console.error('Error deleting Zoom meeting:', error)
      throw new Error('Failed to delete Zoom meeting')
    }
  }

  async listMeetings(): Promise<any> {
    try {
      const headers = await this.getHeaders()
      const response = await axios.get(
        `${ZOOM_BASE_URL}/users/me/meetings`,
        { headers }
      )
      
      return response.data
    } catch (error) {
      console.error('Error listing Zoom meetings:', error)
      throw new Error('Failed to list Zoom meetings')
    }
  }
}

export const zoomAPI = new ZoomAPI()
