// lib/constants.ts

/**
 * The canonical URL for the production application.
 * This is used for all absolute URL generation (e.g., Azure redirects, sitemaps, etc.)
 *
 * NOTE: This is read from the Vercel Environment variable NEXT_PUBLIC_SITE_URL.
 * It MUST be set correctly in Vercel to https://echo.orrya.co.uk
 */
export const CANONICAL_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';