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
        relative z-30
        border-b border-white/10
        bg-slate-950/85
        bg-gradient-to-b from-slate-900/80 to-slate-950/95
        backdrop-blur-2xl
      "
    >
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-6 px-6 py-3">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <span className="text-xl font-semibold tracking-wide bg-gradient-to-r from-sky-400 via-fuchsia-400 to-violet-300 text-transparent bg-clip-text drop-shadow-[0_0_18px_rgba(56,189,248,0.55)]">
            Echo Suite
          </span>
        </div>

        {/* Nav links */}
        <div
          className="
            inline-flex items-center gap-1
            rounded-full
            bg-white/5
            border border-white/10
            shadow-[0_0_40px_rgba(15,23,42,0.9)]
            px-2 py-1
          "
        >
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={name}
                href={href}
                className={`
                  group flex items-center gap-2
                  px-3 py-1.5 text-sm font-medium
                  rounded-full
                  transition-all
                  ${
                    active
                      ? "bg-white/20 text-sky-50 shadow-[0_0_20px_rgba(56,189,248,0.55)]"
                      : "text-slate-200/80 hover:text-sky-100 hover:bg-white/10"
                  }
                `}
              >
                <Icon
                  size={18}
                  className="opacity-80 group-hover:opacity-100"
                />
                <span className="hidden sm:inline">{name}</span>
              </Link>
            );
          })}
        </div>

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="
            inline-flex items-center gap-1
            rounded-full
            border border-white/10
            bg-white/5
            px-3 py-1.5 text-sm
            text-slate-200/85
            hover:text-sky-100 hover:bg-white/10
            transition-colors shadow-[0_0_20px_rgba(15,23,42,0.8)]
          "
        >
          <LogOut size={18} className="opacity-80" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </div>
    </nav>
  );
}
