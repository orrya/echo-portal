"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Mail,
  Calendar,
  Settings as SettingsIcon,
  LogOut,
  BookOpen,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import { supabase } from "@/lib/supabase/client";
import { useHeadspace } from "@/app/context/HeadspaceContext";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Emails", href: "/email", icon: Mail },
  { name: "Summaries", href: "/summary", icon: BookOpen },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "EchoJar", href: "/jar", icon: Sparkles },
  { name: "Settings", href: "/settings", icon: SettingsIcon },
];

export default function NavBar() {
  const pathname = usePathname();
  const { mode } = useHeadspace();

  // 🔒 Quiet = no navbar (unchanged)
  if (mode === "quiet") return null;

  // 🧠 NEW: nav density by headspace
  const visibleItems =
    mode === "aware"
      ? navItems.filter((i) =>
          ["Dashboard", "Calendar", "EchoJar"].includes(i.name)
        )
      : navItems;

  return (
    <nav className="z-30 relative backdrop-blur-xl bg-[#020617]/70 border-b border-white/10 px-6 py-4 flex items-center justify-between transition-all duration-500">
      {/* LEFT */}
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <Image
            src="/echo-logo.png"
            alt="Echo"
            width={30}
            height={30}
            className="opacity-95"
          />
          <span className="text-xl font-semibold tracking-wide bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
            Echo Suite
          </span>
        </div>

        {/* NAV LINKS */}
        <div className="flex items-center gap-6">
          {visibleItems.map(({ name, href, icon: Icon }) => {
            const active = pathname === href;

            return (
              <Link
                key={name}
                href={href}
                className={`relative flex items-center gap-2 px-4 py-1.5 rounded-full text-sm transition-all duration-200 ${
                  active
                    ? "text-white bg-gradient-to-r from-fuchsia-500/20 via-violet-500/20 to-sky-500/20 shadow-[0_0_18px_rgba(129,140,248,0.45)]"
                    : "text-slate-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon size={18} />
                <span>{name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* RIGHT */}
      <button
        onClick={async () => {
          await supabase.auth.signOut();
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
