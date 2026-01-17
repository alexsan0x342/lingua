import { prisma } from "../lib/db";

async function getLocationFromIP(ipAddress: string): Promise<{
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
}> {
  try {
    // Extract IPv4 address from IPv6-mapped IPv4 addresses
    let cleanIP = ipAddress;
    if (ipAddress.startsWith('::ffff:')) {
      cleanIP = ipAddress.substring(7);
    }
    
    // Skip localhost and private IPs
    if (cleanIP === '::1' || cleanIP === '127.0.0.1' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || cleanIP.startsWith('172.')) {
      console.log(`Skipping local IP: ${cleanIP}`);
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local',
        isp: 'Local Network'
      };
    }
    
    console.log(`Fetching location for IP: ${cleanIP}`);
    
    // Using ipapi.co for IP geolocation
    const response = await fetch(`https://ipapi.co/${cleanIP}/json/`, {
      headers: {
        'User-Agent': 'Mozilla/5.0'
      }
    });
    
    if (!response.ok) {
      console.error(`API returned status ${response.status}`);
      const text = await response.text();
      console.error(`Response: ${text}`);
      throw new Error(`HTTP ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`API Response:`, data);
    
    return {
      country: data.country_name || 'Unknown',
      city: data.city || 'Unknown',
      region: data.region || 'Unknown',
      isp: data.org || 'Unknown'
    };
  } catch (error) {
    console.error('Failed to get location from IP:', error);
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown',
      isp: 'Unknown'
    };
  }
}

async function fixDeviceLocation() {
  try {
    console.log('🔍 Checking device with IP 102.164.96.39...\n');
    
    // Get the specific device
    const device = await prisma.deviceTracking.findFirst({
      where: {
        ipAddress: '102.164.96.39'
      }
    });

    if (!device) {
      console.log('Device not found');
      return;
    }

    console.log(`Found device: ${device.id}`);
    console.log(`Current location: ${device.city}, ${device.region}, ${device.country}\n`);
    
    // Get location data
    console.log('Fetching fresh location data...');
    const locationData = await getLocationFromIP(device.ipAddress);
    
    // Update device with location data
    await prisma.deviceTracking.update({
      where: { id: device.id },
      data: {
        country: locationData.country,
        city: locationData.city,
        region: locationData.region,
        isp: locationData.isp
      }
    });

    console.log(`\n✅ Updated device location to: ${locationData.city}, ${locationData.region}, ${locationData.country}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function main() {
  console.log('🚀 Fixing device location for IP 102.164.96.39\n');
  
  await fixDeviceLocation();
  
  console.log('\n🎉 Done!');
  process.exit(0);
}

main();
