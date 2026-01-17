import { prisma } from '../lib/db'

async function clearLogoSetting() {
  try {
    console.log('🔄 Clearing site_logo setting from database...')
    
    // Delete the site_logo setting from the database
    const result = await prisma.siteSettings.deleteMany({
      where: {
        key: 'site_logo'
      }
    })
    
    console.log(`✅ Removed ${result.count} site_logo setting(s) from database`)
    console.log('📁 The app will now use the default /logo.png file from public folder')
    
  } catch (error) {
    console.error('❌ Error clearing logo setting:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearLogoSetting()