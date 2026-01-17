"use client";

import { useState, useEffect } from "react";

interface SiteSettings {
  site_name: string;
  site_description: string;
  primary_color: string;
  secondary_color: string;
  logo_url: string;
  favicon_url: string;
}

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>({
    site_name: process.env.NEXT_PUBLIC_SITE_NAME || 'LMS Showcase',
    site_description: 'Explore Our Courses',
    primary_color: '#4F46E5',
    secondary_color: '#7C3AED',
    logo_url: '/logo.svg',
    favicon_url: '/favicon.ico',
  });
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/public/site-settings', {
        cache: 'no-store' // Ensure we get fresh data
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();

    // Listen for site settings updates
    const handleSettingsUpdate = () => {
      fetchSettings();
    };

    window.addEventListener('site-settings-updated', handleSettingsUpdate);
    
    return () => {
      window.removeEventListener('site-settings-updated', handleSettingsUpdate);
    };
  }, []);

  const refreshSettings = () => {
    setLoading(true);
    fetchSettings();
  };

  return { settings, loading, refreshSettings };
}
