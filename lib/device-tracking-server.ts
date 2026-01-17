import "server-only";

export async function getClientIP(request: Request): Promise<string> {
  try {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return '127.0.0.1'; // fallback for localhost
  } catch (error) {
    console.error("Error getting client IP:", error);
    return '127.0.0.1';
  }
}

export async function getUserAgent(request: Request): Promise<string> {
  try {
    return request.headers.get('user-agent') || 'Unknown';
  } catch (error) {
    console.error("Error getting user agent:", error);
    return 'Unknown';
  }
}

export async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
}> {
  try {
    // Extract IPv4 address from IPv6-mapped IPv4 addresses
    let cleanIP = ipAddress;
    if (ipAddress.startsWith('::ffff:')) {
      cleanIP = ipAddress.substring(7); // Remove '::ffff:' prefix
    }
    
    // Skip localhost and private IPs
    if (cleanIP === '127.0.0.1' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || cleanIP.startsWith('172.')) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local',
        isp: 'Local Network'
      };
    }
    
    // Using ipapi.co for IP geolocation (free tier: 1000 requests/day)
    const response = await fetch(`https://ipapi.co/${cleanIP}/json/`);
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        isp: data.org || 'Unknown'
      };
    }
  } catch (error) {
    console.error('Failed to get location from IP:', error);
  }
  
  return {
    country: 'Unknown',
    city: 'Unknown',
    region: 'Unknown',
    isp: 'Unknown'
  };
}
