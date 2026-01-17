import { prisma } from '../lib/db'
import { clearSiteSettingsCache } from '../lib/site-settings'

async function clearFaviconAndLogoSettings() {
  try {
    console.log('🔄 Clearing favicon and logo settings from database...')
    
    // Delete favicon and logo settings
    const result = await prisma.siteSettings.deleteMany({
      where: {
        key: {
          in: ['favicon', 'site_logo']
        }
      }
    })
    
    console.log(`✅ Removed ${result.count} favicon/logo setting(s) from database`)
    
    // Clear the cached settings
    clearSiteSettingsCache()
    console.log('✅ Site settings cache cleared')
    
    console.log('📁 App will now use static files:')
    console.log('   - /favicon.ico for favicon')
    console.log('   - /logo.png for logo')
    
  } catch (error) {
    console.error('❌ Error clearing settings:', error)
  } finally {
    await prisma.$disconnect()
  }
}

clearFaviconAndLogoSettings()