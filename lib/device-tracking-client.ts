"use client";

export interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  country?: string;
  city?: string;
  region?: string;
  isp?: string;
}

export function generateDeviceId(): string {
  try {
    // Generate a unique device ID based on browser fingerprint
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasData = '';
    
    if (ctx) {
      try {
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('Device fingerprint', 2, 2);
        canvasData = canvas.toDataURL();
      } catch (canvasError) {
        console.warn("Canvas fingerprinting failed:", canvasError);
        canvasData = 'canvas-unavailable';
      }
    }
    
    const fingerprint = [
      navigator.userAgent || 'unknown-ua',
      navigator.language || 'unknown-lang',
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset().toString(),
      canvasData
    ].join('|');
    
    // Create a hash of the fingerprint
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  } catch (error) {
    console.error("Device ID generation failed:", error);
    // Fallback to timestamp + random
    return `fallback-${Date.now()}-${Math.random().toString(36).substring(2)}`;
  }
}

