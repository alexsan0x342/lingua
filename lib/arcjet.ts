import "server-only";

import arcjet, {
  detectBot,
  fixedWindow,
  sensitiveInfo,
  shield,
  slidingWindow,
  validateEmail,
} from "@arcjet/next";
import { env } from "./env";

export {
  detectBot,
  fixedWindow,
  sensitiveInfo,
  shield,
  slidingWindow,
  validateEmail,
};

// Enable Arcjet with full-fledged bot detection and security protection
export default arcjet({
  key: env.ARCJET_KEY && env.ARCJET_KEY.startsWith('ajkey_') ? env.ARCJET_KEY : 'ajkey_00000000000000000000000000000000',

  // Don't use IP characteristic to avoid fingerprint errors
  // Arcjet will use default fingerprinting
  characteristics: [],

  rules: [
    // Shield against common attacks (SQL injection, XSS, etc.)
    shield({
      mode: env.NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
    }),
    
    // Detect and block automated bots
    detectBot({
      mode: env.NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
      // Block all automated clients except search engine crawlers
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),
    
    // Rate limiting with sliding window for better protection
    slidingWindow({
      mode: env.NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
      interval: "1m",
      max: env.NODE_ENV === 'development' ? 1000 : 500, // 500 requests per minute in production
    }),
    
    // Additional rate limit for sensitive endpoints (configurable per route)
    fixedWindow({
      mode: env.NODE_ENV === 'development' ? "DRY_RUN" : "LIVE",
      window: "15m",
      max: env.NODE_ENV === 'development' ? 5000 : 2500, // 2500 requests per 15 minutes
    }),
  ],
});
