'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Mail, Calendar, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { supabaseClient } from '@/lib/supabaseClient'

const navItems = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Emails', href: '/email', icon: Mail },
  { name: 'Summaries', href: '/summary', icon: Calendar },
  { name: 'Settings', href: '/settings', icon: SettingsIcon },
]

export default function NavBar() {
  const pathname = usePathname()

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut()
    window.location.href = '/auth/sign-in'
  }

  return (
    <nav className="bg-graphite-dark text-white flex items-center justify-between px-4 py-3 shadow-glass">
      <div className="flex items-center gap-6">
        <span className="text-xl font-bold text-purple">Echo Suite</span>
        {navItems.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={`flex items-center gap-2 hover:text-magenta transition-colors ${
              pathname === href ? 'text-magenta' : 'text-purple'
            }`}
          >
            <Icon size={20} />
            <span className="hidden sm:inline">{name}</span>
          </Link>
        ))}
      </div>
      <button
        onClick={handleSignOut}
        className="text-purple hover:text-magenta transition-colors flex items-center gap-1"
      >
        <LogOut size={20} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </nav>
  )
}