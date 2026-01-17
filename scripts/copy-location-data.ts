import { prisma } from "../lib/db";

async function copyLocationFromRedemption() {
  try {
    console.log('🔍 Finding redemption with location data for IP 102.164.96.39...\n');
    
    // Get redemption with location data
    const redemption = await prisma.codeRedemption.findFirst({
      where: {
        ipAddress: '102.164.96.39',
        country: { not: 'Unknown' }
      }
    });

    if (!redemption) {
      console.log('No redemption found with location data');
      return;
    }

    console.log(`Found redemption with location: ${redemption.city}, ${redemption.region}, ${redemption.country}\n`);
    
    // Get all devices with this IP
    const devices = await prisma.deviceTracking.findMany({
      where: {
        ipAddress: '102.164.96.39'
      }
    });

    console.log(`Found ${devices.length} device(s) to update\n`);
    
    // Update all devices with the same IP to have the same location
    for (const device of devices) {
      await prisma.deviceTracking.update({
        where: { id: device.id },
        data: {
          country: redemption.country,
          city: redemption.city,
          region: redemption.region,
          isp: redemption.isp
        }
      });
      console.log(`✅ Updated device ${device.id}`);
    }

    console.log(`\n✅ All devices updated to: ${redemption.city}, ${redemption.region}, ${redemption.country}`);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function updateLocalDevices() {
  try {
    console.log('\n🔍 Updating localhost devices (::1 and 127.0.0.1)...\n');
    
    const localDevices = await prisma.deviceTracking.findMany({
      where: {
        OR: [
          { ipAddress: '::1' },
          { ipAddress: '127.0.0.1' }
        ]
      }
    });

    console.log(`Found ${localDevices.length} local device(s) to update\n`);
    
    for (const device of localDevices) {
      await prisma.deviceTracking.update({
        where: { id: device.id },
        data: {
          country: 'Local',
          city: 'Local',
          region: 'Local',
          isp: 'Local Network'
        }
      });
      console.log(`✅ Updated device ${device.id} (${device.ipAddress})`);
    }
    
  } catch (error) {
    console.error('❌ Error updating local devices:', error);
  }
}

async function main() {
  console.log('🚀 Copying location data from redemptions to devices\n');
  
  await copyLocationFromRedemption();
  await updateLocalDevices();
  
  console.log('\n🎉 Done!');
  process.exit(0);
}

main();
