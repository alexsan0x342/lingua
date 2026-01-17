import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";
import arcjet, {
  createMiddleware,
  detectBot,
  fixedWindow,
  shield,
} from "@arcjet/next";

// Configure Arcjet with enhanced security rules
const aj = arcjet({
  key: process.env.ARCJET_KEY || "ajkey_00000000000000000000000000000000",
  // Make characteristics optional to handle cases where IP is not available
  characteristics: [],
  rules: [
    // Shield against common attacks (SQL injection, XSS, etc.)
    shield({
      mode: process.env.NODE_ENV === "development" ? "DRY_RUN" : "LIVE",
    }),
    // Detect and block malicious bots
    detectBot({
      mode: process.env.NODE_ENV === "development" ? "DRY_RUN" : "LIVE",
      allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:MONITOR", "CATEGORY:PREVIEW"],
    }),
    // Rate limiting for all routes
    fixedWindow({
      mode: process.env.NODE_ENV === "development" ? "DRY_RUN" : "LIVE",
      window: "1m",
      max: process.env.NODE_ENV === "development" ? 1000 : 500,
    }),
  ],
});

// Security headers middleware
function addSecurityHeaders(response: NextResponse) {
  // Security headers for production
  if (process.env.NODE_ENV === "production") {
    response.headers.set("X-Frame-Options", "DENY");
    response.headers.set("X-Content-Type-Options", "nosniff");
    response.headers.set("X-XSS-Protection", "1; mode=block");
    response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
    response.headers.set(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=()",
    );

    // Strict Transport Security for HTTPS
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );

    // Remove server information
    response.headers.set("Server", "");
    response.headers.delete("X-Powered-By");

    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com https://www.gstatic.com https://upload-widget.cloudinary.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob: https://res.cloudinary.com",
      "media-src 'self' https: blob: data: https://res.cloudinary.com",
      "connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://api.arcjet.com https://res.cloudinary.com https://video.bunnycdn.com https://*.cdn.lingua-ly.com",
      "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://upload-widget.cloudinary.com https://widget.cloudinary.com https://iframe.mediadelivery.net",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", csp);
  } else {
    // More permissive CSP for development
    const devCsp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https:",
      "style-src 'self' 'unsafe-inline' https:",
      "font-src 'self' https:",
      "img-src 'self' data: https: blob:",
      "media-src 'self' https: blob: data:",
      "connect-src 'self' https:",
      "frame-src 'self' https:",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; ");

    response.headers.set("Content-Security-Policy", devCsp);
  }

  return response;
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  "/",
  "/login",
  "/signup",
  "/register",
  "/courses",
  "/course",
  "/get-started",
  "/forgot-password",
  "/reset-password",
  "/verify-email", // Add verify email route as public
];

// Routes that require authentication but not email verification
const AUTH_EXEMPT_ROUTES = ["/settings", "/logout"];

// Public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  "/api/public/site-settings",
  "/api/health",
  "/api/webhook",
  "/api/startup-tasks",
  "/api/language", // Allow language switching without authentication
  "/api/auth", // All auth endpoints are public
];

// Check if route is public
function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some((route) => {
    if (route === "/") return pathname === "/";
    if (route === "/course") return pathname.startsWith("/course/");
    return pathname.startsWith(route);
  });
}

// Check if API route is public
function isPublicApiRoute(pathname: string): boolean {
  return PUBLIC_API_ROUTES.some((route) => pathname.startsWith(route));
}

// Authentication middleware
async function authMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  const pathname = request.nextUrl.pathname;

  // Allow public routes without authentication
  if (isPublicRoute(pathname) || isPublicApiRoute(pathname)) {
    return NextResponse.next();
  }

  // For protected routes, require authentication
  if (!sessionCookie) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    return addSecurityHeaders(response);
  }

  return NextResponse.next();
}

// Admin role verification
async function adminAuthMiddleware(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    return addSecurityHeaders(response);
  }

  // For admin routes, we'll verify the role on the server side
  // The admin layout will handle the role check
  // Force English locale for admin panel
  const response = NextResponse.next();
  response.cookies.set("NEXT_LOCALE", "en", {
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export const config = {
  // Match all request paths except for static files and certain API routes
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth/* (Better-Auth)
     * - api/public/* (Public APIs)
     * - api/health (Health checks)
     * - api/webhook/* (Webhooks)
     * - _next/static/* (Next.js static files)
     * - _next/image/* (Next.js image optimization)
     * - favicon.ico
     * - public files (anything with a file extension in root)
     */
    "/((?!api/auth|api/public|api/health|api/webhook|_next/static|_next/image|favicon.ico|[\\w-]+\\.\\w+).*)",
  ],
};

// Main middleware function with Arcjet protection
export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Apply Arcjet protection to all routes
  const decision = await aj.protect(request);

  // Log Arcjet decision in development
  if (process.env.NODE_ENV === "development") {
    console.log("Arcjet decision:", decision.conclusion, "for", pathname);
  }

  // Block denied requests (only in production or if explicitly denied)
  if (decision.isDenied() && process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Forbidden", reason: decision.reason },
      { status: 403 },
    );
  }

  // Special handling for admin routes with strict role verification
  if (pathname.startsWith("/admin")) {
    return adminAuthMiddleware(request);
  }

  // Apply authentication middleware to all routes
  return authMiddleware(request);
}
