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
    if (cleanIP === '127.0.0.1' || cleanIP.startsWith('192.168.') || cleanIP.startsWith('10.') || cleanIP.startsWith('172.')) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local',
        isp: 'Local Network'
      };
    }
    
    console.log(`Fetching location for IP: ${cleanIP}`);
    
    // Using ipapi.co for IP geolocation
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

async function updateDeviceLocations() {
  try {
    console.log('🔍 Fetching device tracking records without location data...');
    
    // Get all device tracking records that don't have location data
    const devices = await prisma.deviceTracking.findMany({
      where: {
        OR: [
          { country: null },
          { country: 'Unknown' },
          { city: null },
          { city: 'Unknown' }
        ]
      }
    });

    console.log(`Found ${devices.length} devices to update`);

    for (const device of devices) {
      console.log(`\nProcessing device ${device.id} (IP: ${device.ipAddress})...`);
      
      // Get location data
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

      console.log(`✅ Updated: ${locationData.city}, ${locationData.region}, ${locationData.country}`);
      
      // Add delay to avoid rate limiting (ipapi.co free tier: 1000/day, ~40/minute)
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ All device locations updated successfully!');
  } catch (error) {
    console.error('❌ Error updating device locations:', error);
  }
}

async function updateRedemptionLocations() {
  try {
    console.log('\n🔍 Fetching code redemption records without location data...');
    
    // Get all code redemptions that don't have location data
    const redemptions = await prisma.codeRedemption.findMany({
      where: {
        OR: [
          { country: null },
          { country: 'Unknown' },
          { city: null },
          { city: 'Unknown' }
        ],
        ipAddress: {
          not: null
        }
      }
    });

    console.log(`Found ${redemptions.length} redemptions to update`);

    for (const redemption of redemptions) {
      if (!redemption.ipAddress) continue;
      
      console.log(`\nProcessing redemption ${redemption.id} (IP: ${redemption.ipAddress})...`);
      
      // Get location data
      const locationData = await getLocationFromIP(redemption.ipAddress);
      
      // Update redemption with location data
      await prisma.codeRedemption.update({
        where: { id: redemption.id },
        data: {
          country: locationData.country,
          city: locationData.city,
          region: locationData.region,
          isp: locationData.isp
        }
      });

      console.log(`✅ Updated: ${locationData.city}, ${locationData.region}, ${locationData.country}`);
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('\n✅ All redemption locations updated successfully!');
  } catch (error) {
    console.error('❌ Error updating redemption locations:', error);
  }
}

async function main() {
  console.log('🚀 Starting location data update...\n');
  
  await updateDeviceLocations();
  await updateRedemptionLocations();
  
  console.log('\n🎉 All done!');
  process.exit(0);
}

main();
