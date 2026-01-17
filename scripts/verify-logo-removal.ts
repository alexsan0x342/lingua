import { prisma } from '../lib/db'
import { clearSiteSettingsCache } from '../lib/site-settings'

async function clearCacheAndVerify() {
  try {
    console.log('🔄 Clearing site settings cache...')
    
    // Clear the cached settings
    clearSiteSettingsCache()
    
    console.log('✅ Site settings cache cleared')
    
    // Verify the logo setting is gone
    const logoSetting = await prisma.siteSettings.findUnique({
      where: { key: 'site_logo' }
    })
    
    if (logoSetting) {
      console.log('⚠️  Logo setting still exists in database:', logoSetting.value)
    } else {
      console.log('✅ Confirmed: site_logo setting removed from database')
      console.log('📁 App will now use /logo.png from public folder')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearCacheAndVerify()