import { useState, useEffect } from 'react';

// Utility to check OAuth configuration
export function isGoogleOAuthConfigured(): boolean {
  return !!(
    process.env.GOOGLE_CLIENT_ID && 
    process.env.GOOGLE_CLIENT_SECRET && 
    process.env.GOOGLE_CLIENT_ID !== "" && 
    process.env.GOOGLE_CLIENT_SECRET !== ""
  );
}

// Client-side hook to check OAuth configuration
export function useGoogleOAuthConfigured(): boolean {
  const [isConfigured, setIsConfigured] = useState(false);
  
  useEffect(() => {
    // Check if Google OAuth is configured by making a test request
    fetch('/api/auth/providers')
      .then(res => res.json())
      .then(data => {
        setIsConfigured(!!data.google);
      })
      .catch(() => {
        setIsConfigured(false);
      });
  }, []);
  
  return isConfigured;
}

export function getOAuthProviders() {
  const providers = [];
  
  if (isGoogleOAuthConfigured()) {
    providers.push('google');
  }
  
  return providers;
}
