'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Clock, Video, Users, ExternalLink, Play } from 'lucide-react'
import { toast } from 'sonner'
import { useTranslations, useLocale } from '@/components/general/I18nProvider'

interface LiveLesson {
  id: string
  title: string
  description?: string
  scheduledAt: string
  duration: number
  status: 'Scheduled' | 'InProgress' | 'Completed' | 'Cancelled'
  zoomJoinUrl?: string
  zoomPassword?: string
  recordingUrl?: string
  course?: {
    id: string
    title: string
  }
}

export default function LiveLessonsWidget() {
  const t = useTranslations();
  const locale = useLocale();
  const [liveLessons, setLiveLessons] = useState<LiveLesson[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchLiveLessons()
  }, [])

  const fetchLiveLessons = async () => {
    try {
      const response = await fetch('/api/live-lessons')
      if (response.ok) {
        const data = await response.json()
        // Filter for upcoming, ongoing lessons, completed lessons, and recently ended lessons
        const relevantLessons = data.filter((lesson: LiveLesson) => {
          const now = new Date()
          const scheduledAt = new Date(lesson.scheduledAt)
          const endTime = new Date(scheduledAt.getTime() + lesson.duration * 60000)
          const hoursSinceEnd = (now.getTime() - endTime.getTime()) / (1000 * 60 * 60)
          
          return (
            lesson.status === 'Scheduled' || 
            lesson.status === 'InProgress' ||
            (lesson.status === 'Completed' && lesson.recordingUrl) ||
            // Show lessons that ended recently (within 24 hours) or have recordings
            (now > endTime && (hoursSinceEnd <= 24 || lesson.recordingUrl))
          )
        })
        setLiveLessons(relevantLessons)
      }
    } catch (error) {
      console.error('Error fetching live lessons:', error)
      toast.error("Failed to fetch live lessons")
    } finally {
      setIsLoading(false)
    }
  }

  const isLessonStartingSoon = (scheduledAt: string) => {
    const lessonTime = new Date(scheduledAt)
    const now = new Date()
    const timeDiff = lessonTime.getTime() - now.getTime()
    const minutesDiff = timeDiff / (1000 * 60)
    return minutesDiff <= 15 && minutesDiff >= -5 // Starting within 15 minutes or started within last 5 minutes
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const getTimeUntilStart = (scheduledAt: string) => {
    const lessonTime = new Date(scheduledAt)
    const now = new Date()
    const timeDiff = lessonTime.getTime() - now.getTime()
    const minutesDiff = Math.floor(timeDiff / (1000 * 60))
    const hoursDiff = Math.floor(minutesDiff / 60)
    const daysDiff = Math.floor(hoursDiff / 24)

    if (timeDiff < 0) {
      const pastMinutes = Math.abs(minutesDiff)
      if (pastMinutes < 60) {
        return `Started ${pastMinutes} min ago`
      } else {
        return `Started ${Math.floor(pastMinutes / 60)}h ago`
      }
    }

    if (daysDiff > 0) {
      return `In ${daysDiff} day${daysDiff > 1 ? 's' : ''}`
    } else if (hoursDiff > 0) {
      return `In ${hoursDiff}h ${minutesDiff % 60}min`
    } else if (minutesDiff > 0) {
      return `In ${minutesDiff} minute${minutesDiff > 1 ? 's' : ''}`
    } else {
      return 'Starting now'
    }
  }

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes}min`
    } else {
      const hours = Math.floor(minutes / 60)
      const remainingMins = minutes % 60
      return remainingMins > 0 ? `${hours}h ${remainingMins}min` : `${hours}h`
    }
  }

  const getActualStatus = (lesson: LiveLesson) => {
    const now = new Date()
    const scheduledAt = new Date(lesson.scheduledAt)
    const endTime = new Date(scheduledAt.getTime() + lesson.duration * 60000) // duration in minutes to milliseconds
    
    // If lesson is manually set to Completed or Cancelled, respect that
    if (lesson.status === 'Completed' || lesson.status === 'Cancelled') {
      return lesson.status
    }
    
    // Check if current time is past the scheduled end time
    if (now > endTime) {
      return 'Ended'
    }
    
    // Check if lesson should be in progress
    if (now >= scheduledAt && now <= endTime) {
      return 'InProgress'
    }
    
    // Otherwise it's scheduled for the future
    return 'Scheduled'
  }

  const getStatusVariant = (actualStatus: string) => {
    switch (actualStatus) {
      case 'InProgress':
        return 'default'
      case 'Ended':
        return 'destructive'
      case 'Completed':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  if (isLoading || !mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Live Lessons
          </CardTitle>
          <CardDescription>Your upcoming live lessons and meetings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (liveLessons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {t("liveLesson.liveLessons")}
          </CardTitle>
          <CardDescription>{t("liveLesson.upcomingLessons")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <Video className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">{t("liveLesson.noUpcomingLessons")}</h3>
            <p className="text-sm text-muted-foreground">
              {t("liveLesson.lessonsAppearHere")}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Categorize lessons
  const now = new Date()
  const liveNowLessons = liveLessons.filter(lesson => {
    const actualStatus = getActualStatus(lesson)
    return actualStatus === 'InProgress'
  })

  const upcomingLessons = liveLessons.filter(lesson => {
    const actualStatus = getActualStatus(lesson)
    return actualStatus === 'Scheduled'
  })

  const endedLessons = liveLessons.filter(lesson => {
    const actualStatus = getActualStatus(lesson)
    return actualStatus === 'Ended' || lesson.status === 'Completed'
  })

  const renderLessonCard = (lesson: LiveLesson) => {
    const { date, time } = formatDateTime(lesson.scheduledAt)
    const canJoin = isLessonStartingSoon(lesson.scheduledAt)
    const timeUntilStart = getTimeUntilStart(lesson.scheduledAt)
    const actualStatus = getActualStatus(lesson)
    
    return (
      <Card key={lesson.id} className="border-muted">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div className="space-y-1">
              <h4 className="font-semibold leading-none">{lesson.title}</h4>
              {lesson.description && (
                <p className="text-sm text-muted-foreground">
                  {lesson.description}
                </p>
              )}
            </div>
            <Badge variant={getStatusVariant(actualStatus)}>
              {actualStatus === 'InProgress' ? t("liveLesson.inProgress") : 
               actualStatus === 'Ended' ? t("liveLesson.ended") :
               actualStatus === 'Scheduled' ? t("liveLesson.scheduled") : actualStatus}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{date}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{time}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{formatDuration(lesson.duration)}</span>
            </div>
            <div className="text-sm font-medium">
              {actualStatus === 'Ended' ? t("liveLesson.meetingEnded") : timeUntilStart}
            </div>
          </div>
          
          {lesson.course && (
            <div className="mb-3">
              <Badge variant="outline" className="text-xs">
                {t("liveLesson.course")}: {lesson.course.title}
              </Badge>
            </div>
          )}

          <div className="flex flex-col gap-3">
          

            {/* Join Button for Active/Upcoming Lessons */}
            {lesson.zoomJoinUrl && actualStatus !== 'Ended' && actualStatus !== 'Completed' && lesson.status !== 'Cancelled' && (
              <div className="flex gap-2">
                <Button
                  asChild
                  size="sm"
                  variant={actualStatus === 'InProgress' ? "default" : "outline"}
                  className={actualStatus === 'InProgress' ? "bg-primary hover:bg-primary/90 text-primary-foreground" : ""}
                >
                  <a 
                    href={lesson.zoomJoinUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    {actualStatus === 'InProgress' ? t("liveLesson.joinNow") : t("liveLesson.joinMeeting")}
                  </a>
                </Button>
                {lesson.zoomPassword && (
                  <div className="flex items-center text-xs text-muted-foreground">
                    {t("liveLesson.password")}: <code className="ml-1 bg-muted px-1 rounded">{lesson.zoomPassword}</code>
                  </div>
                )}
              </div>
            )}

            {canJoin && (
              <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-md p-3">
                <p className="text-sm text-green-800 dark:text-green-200 font-medium">
                  🟢 {t("liveLesson.startingSoon")}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Live Now Section */}
      {liveNowLessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-red-500" />
              {t("liveLesson.liveNow")}
            </CardTitle>
            <CardDescription>{t("liveLesson.joinLesson")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {liveNowLessons.map(lesson => renderLessonCard(lesson))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upcoming Lessons Section */}
      {upcomingLessons.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              {t("liveLesson.upcomingLessons")}
            </CardTitle>
            <CardDescription>{t("liveLesson.scheduledLessons")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingLessons.map(lesson => renderLessonCard(lesson))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}