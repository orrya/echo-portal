// lib/constants.ts

/**
 * Canonical public URL for the production deployment.
 * MUST be set in Vercel as NEXT_PUBLIC_SITE_URL = https://echo.orrya.co.uk
 *
 * All OAuth redirects + absolute URL generation rely on this.
 */
const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

// Normalize (no trailing slash)
export const CANONICAL_URL = raw.endsWith("/")
  ? raw.slice(0, -1)
  : raw;
