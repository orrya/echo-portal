import { Inter } from 'next/font/google';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

// Assuming you have a global CSS file where Tailwind is imported
import '@/app/globals.css'; 

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Echo Suite | Orrya',
  description: 'Quiet tools for louder thinking. The intelligence layer for your Microsoft 365 data.',
};

/**
 * The Root Layout wraps the entire application.
 * * IMPORTANT: This layout MUST NOT contain any authentication checks or redirects,
 * as it wraps the /auth/sign-in page, which would cause an infinite loop.
 * Authentication logic belongs in the specific sub-layouts (like app/(site)/layout.tsx).
 */
export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* The entire application content, including both protected and public routes, 
            is rendered here. The session checks are handled by the nested layouts/middleware. */}
        {children}
      </body>
    </html>
  );
}