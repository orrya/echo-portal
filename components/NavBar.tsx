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
import Image from "next/image";
import { supabaseClient } from "@/lib/supabaseClient";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Emails", href: "/email", icon: Mail },
  { name: "Summaries", href: "/summary", icon: Calendar },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
  { name: "Calendar", href: "/calendar", icon: Calendar },
];

export default function NavBar() {
  const pathname = usePathname();
  return (
    <nav
      className="
        z-30 relative
        backdrop-blur-xl bg-[#020617]/70
        border-b border-white/10
        px-6 py-4 flex items-center justify-between
      "
    >
      {/* LEFT SECTION — LOGO + BRAND */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <Image
            src="/echo-logo.png"
            alt="Echo"
            width={30}
            height={30}
            className="opacity-95"
          />
          <span
            className="
              text-xl font-semibold tracking-wide
              bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
              bg-clip-text text-transparent
            "
          >
            Echo Suite
          </span>
        </div>

        {/* NAV LINKS */}
        <div className="flex items-center gap-6">
          {navItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={name}
                href={href}
                className={`
                  relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm
                  transition-all duration-200
                  ${
                    active
                      ? "text-white bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-sky-500/20 shadow-[0_0_18px_rgba(129,140,248,0.45)]"
                      : "text-slate-300 hover:text-white hover:bg-white/5"
                  }
                `}
              >
                <Icon size={18} />
                <span>{name}</span>

                {/* Orrya-style underline */}
                {active && (
                  <span
                    className="
                      absolute -bottom-[4px] left-0 right-0 mx-auto
                      h-[2px] w-8
                      bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400
                      rounded-full
                    "
                  />
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* SIGN OUT */}
      <button
        onClick={async () => {
          await supabaseClient.auth.signOut();
          window.location.href = "/auth/sign-in";
        }}
        className="flex items-center gap-1 text-slate-300 hover:text-white transition"
      >
        <LogOut size={20} />
        <span className="hidden sm:inline">Sign out</span>
      </button>
    </nav>
  );
}
