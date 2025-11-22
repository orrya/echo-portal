// lib/constants.ts

/**
 * Canonical URL for the production deployment.
 * Set in Vercel as NEXT_PUBLIC_SITE_URL = "https://echo.orrya.co.uk"
 */
const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Normalize (no trailing slash)
export const CANONICAL_URL = raw.endsWith("/")
  ? raw.slice(0, -1)
  : raw;
