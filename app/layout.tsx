import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { getSiteSettings, clearSiteSettingsCache } from "@/lib/site-settings";
import { StartupTasks } from "@/components/StartupTasks";
import { constructUrl } from "@/hooks/use-construct-url";
import { I18nProvider } from "@/components/general/I18nProvider";
import { EmailVerificationGuard } from "@/components/auth/EmailVerificationGuard";
import { cookies } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  // Clear cache to ensure fresh settings
  clearSiteSettingsCache();
  const siteSettings = await getSiteSettings();
  
  // Use favicon from settings or fallback to default
  const faviconUrl = siteSettings.favicon_url || '/favicon.ico';
  
  // Add cache busting parameter to force browser to reload favicon
  const cacheBustingFaviconUrl = faviconUrl === '/favicon.ico' 
    ? faviconUrl 
    : `${faviconUrl}?v=${Date.now()}`;
  
  return {
    title: siteSettings.site_name,
    description: siteSettings.site_description,
    icons: {
      icon: cacheBustingFaviconUrl,
      shortcut: cacheBustingFaviconUrl,
      apple: cacheBustingFaviconUrl,
    },
  };
}

async function getLocaleAndMessages() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'en';
  const messages = (await import(`@/messages/${locale}.json`)).default;
  return { locale, messages };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, messages } = await getLocaleAndMessages();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        <I18nProvider initialLocale={locale} initialMessages={messages}>
          <StartupTasks />
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <EmailVerificationGuard>
              {children}
            </EmailVerificationGuard>
            <Toaster closeButton position="bottom-center" />
          </ThemeProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
