import { prisma } from "./db";
import { getCacheOrFetch, getCacheKey, CACHE_PREFIX, CACHE_TTL, deleteCache } from "./cache";

interface SiteSettings {
  site_name: string;
  site_description: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
  // Email branding settings
  email_header_color: string;
  email_button_color: string;
  email_footer_color: string;
  email_logo_url: string;
  email_font_family: string;
  email_accent_color: string;
}

let cachedSettings: SiteSettings | null = null;
let warnedOnce = false;

// Default values if not set
// ⚙️ EDIT THESE VALUES TO CUSTOMIZE YOUR SITE SEO & BRANDING
const defaultSettings: SiteSettings = {
  site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'LMS Showcase',  // Main site title (from .env or fallback)
  site_description: 'Explore Our Courses',      // Meta description for SEO
  primary_color: '#4F46E5',                     // Main brand color
  secondary_color: '#7C3AED',                   // Secondary brand color
  logo_url: '/logo.svg',                        // Path to logo in /public folder
  favicon_url: '/favicon.ico',                  // Path to favicon in /public folder
  // Email branding defaults - Vercel black/white theme
  email_header_color: '#000000',
  email_button_color: '#000000',
  email_footer_color: '#666666',
  email_logo_url: '/logo.svg',
  email_font_family: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
  email_accent_color: '#000000',
};

export async function getSiteSettings(): Promise<SiteSettings> {
  // Return in-memory cached settings if available (for build/fallback)
  if (cachedSettings) {
    return cachedSettings;
  }

  const cacheKey = getCacheKey(CACHE_PREFIX.SITE_SETTINGS, 'all');

  try {
    // Try Redis cache first, then database
    const settings = await getCacheOrFetch(
      cacheKey,
      async () => {
        const dbSettings = await prisma.siteSettings.findMany({
          where: {
            key: {
              in: ['site_name', 'site_description', 'primary_color', 'secondary_color', 
                   'logo_url', 'favicon_url',
                   'email_header_color', 'email_button_color', 'email_footer_color', 'email_logo_url', 
                   'email_font_family', 'email_accent_color']
            }
          }
        });

        const settingsMap = dbSettings.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as Record<string, string>);

        return { ...defaultSettings, ...settingsMap };
      },
      CACHE_TTL.VERY_LONG // Site settings rarely change
    );

    cachedSettings = settings;
    return settings;
  } catch (error) {
    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("⚠️ Database not available during build, using default site settings.");
    }
    // Cache and return defaults on error to avoid repeated logging
    cachedSettings = defaultSettings;
    return cachedSettings;
  }
}

// Function to clear cache when settings are updated
export async function clearSiteSettingsCache() {
  cachedSettings = null;
  await deleteCache(getCacheKey(CACHE_PREFIX.SITE_SETTINGS, 'all'));
}

// Client-side function to get settings
export async function getClientSiteSettings(): Promise<SiteSettings> {
  // Use the same logic as getSiteSettings but for client-side access
  return await getSiteSettings();
}
