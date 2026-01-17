"use client";

import React from 'react';
import Image from 'next/image';
import { useSiteSettings } from '@/hooks/use-site-settings';

export function LogoDebug() {
  const { settings, loading } = useSiteSettings();
  
  React.useEffect(() => {
    console.log('=== LOGO DEBUG INFO ===');
    console.log('Settings loading:', loading);
    console.log('Site settings:', settings);
    console.log('Using static logo: /logo.svg');
    
    // Test if the static logo is accessible
    fetch('/logo.svg')
      .then(res => {
        console.log('Logo fetch response:', res.status, res.statusText);
        return res.blob();
      })
      .then(blob => {
        console.log('Logo blob size:', blob.size, 'bytes');
        console.log('Logo blob type:', blob.type);
      })
      .catch(err => {
        console.error('Logo fetch error:', err);
      });
  }, [settings, loading]);

  if (loading) {
    return <div className="p-4 border rounded">Loading logo debug info...</div>;
  }

  const logoUrl = '/logo.svg';

  return (
    <div className="p-4 border rounded space-y-4">
      <h3 className="font-bold">Logo Debug Information</h3>
      <div className="space-y-2 text-sm">
        <p><strong>Logo URL:</strong> {logoUrl}</p>
        <p><strong>Source:</strong> Static file in /public folder</p>
        <p><strong>Settings loading:</strong> {loading.toString()}</p>
      </div>
      
      <div className="space-y-2">
        <p className="font-medium">Logo Preview (Next.js Image):</p>
        <Image
          src={logoUrl}
          alt="Logo Debug"
          width={64}
          height={64}
          className="border"
          onLoad={() => console.log('Next.js Image loaded successfully:', logoUrl)}
          onError={(e) => {
            console.error('Next.js Image failed to load:', logoUrl);
            console.error('Error event:', e);
          }}
        />
      </div>
      
      <div className="space-y-2">
        <p className="font-medium">Logo Preview (Regular img tag):</p>
        <img
          src={logoUrl}
          alt="Logo Debug (Regular)"
          width={64}
          height={64}
          className="border"
          onLoad={() => console.log('Regular img loaded successfully:', logoUrl)}
          onError={(e) => {
            console.error('Regular img failed to load:', logoUrl);
            console.error('Error event:', e);
          }}
        />
      </div>
      
      <div className="space-y-2">
        <p className="font-medium">Fallback Test:</p>
        <Image
          src="/logo.svg"
          alt="Fallback Logo"
          width={64}
          height={64}
          className="border"
          onLoad={() => console.log('Fallback logo loaded successfully')}
          onError={() => console.error('Even fallback logo failed to load!')}
        />
      </div>
    </div>
  );
}