"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Mail,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
} from "lucide-react";
import { supabaseClient } from "@/lib/supabaseClient";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Emails", href: "/email", icon: Mail },
  { name: "Summaries", href: "/summary", icon: Calendar },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function NavBar() {
  const pathname = usePathname();

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    window.location.href = "/auth/sign-in";
  };

  return (
    <nav
      className="
        relative z-20
        backdrop-blur-xl
        bg-white/2
        supports-[backdrop-filter]:bg-white/2
        border-b border-white/10
        text-white
        flex items-center justify-between
        px-6 py-4
      "
    >
      <div className="flex items-center gap-8">
        {/* Brand */}
        <span className="text-xl font-semibold tracking-wide bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 text-transparent bg-clip-text">
          Echo Suite
        </span>

        {/* Nav links */}
        {navItems.map(({ name, href, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={name}
              href={href}
              className={`
                flex items-center gap-2 transition-all
                ${
                  active
                    ? "text-fuchsia-300 drop-shadow-[0_0_6px_rgba(255,0,255,0.25)]"
                    : "text-slate-300 hover:text-fuchsia-300"
                }
              `}
            >
              <Icon size={20} />
              <span className="hidden sm:inline">{name}</span>
            </Link>
          );
        })}
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="text-slate-300 hover:text-fuchsia-300 transition-colors flex items-center gap-1"
      >
        <LogOut size={20} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </nav>
  );
}
