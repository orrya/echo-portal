import './globals.css'
import { Inter } from 'next/font/google'
import NavBar from '@/components/NavBar'
import { SupabaseProvider } from '@/components/SupabaseProvider'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'Echo Suite Portal',
  description: 'Dashboard for the Echo automation assistant.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="antialiased">
        <SupabaseProvider>
          <NavBar />
          <main className="p-4 container mx-auto">{children}</main>
        </SupabaseProvider>
      </body>
    </html>
  )
}