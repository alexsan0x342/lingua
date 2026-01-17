// Hardcoded CDN URL - works on both client and server
const BUNNY_CDN_URL = "https://cdn.lingua-ly.com";

// Cache buster for development to prevent stale images
const getCacheBuster = () => {
  // Only add cache buster in development or when explicitly needed
  if (typeof window !== "undefined" && window.performance) {
    // Use navigation type to detect hard refresh
    const navEntry = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming;
    if (navEntry && navEntry.type === "reload") {
      return "";
    }
  }
  return "";
};

// Plain function for server-side and client-side usage
export function constructUrl(key: string): string {
  if (!key) {
    return "/placeholder-course.svg";
  }

  // If already a full URL, return as-is
  if (key.startsWith("http")) {
    return key;
  }

  // If it's a Bunny.net storage path (lessons/, courses/, profiles/, images/, etc.)
  if (
    key.match(
      /^(lessons?|courses?|profiles?|logo|favicon|assignments|resources|images)\//,
    )
  ) {
    return `${BUNNY_CDN_URL}/${key}`;
  }

  // If it's a legacy local image path (starts with /images/), use the API route
  if (key.startsWith("/images/")) {
    return `/api/images/${key.replace("/images/", "")}`;
  }

  // If it's already a valid path starting with /, return as-is
  if (key.startsWith("/")) {
    return key;
  }

  // Fallback to placeholder
  return "/placeholder-course.svg";
}

// React hook wrapper for client-side usage
export function useConstructUrl(key: string): string {
  return constructUrl(key);
}
