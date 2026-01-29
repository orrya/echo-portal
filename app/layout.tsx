// app/layout.tsx
import "./globals.css";
import { Inter } from "next/font/google";
import type { Metadata } from "next";
import CinematicOrb from "@/components/CinematicOrb";
import { HeadspaceProvider } from "./context/HeadspaceContext";
import NavBar from "@/components/NavBar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Echo Suite | Orrya",
  description:
    "Quiet tools for louder thinking. The intelligence layer for your Microsoft 365 data.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="relative min-h-screen overflow-x-hidden text-white bg-[#060b1b]">
        <HeadspaceProvider>
          {/* Deep Orrya gradient field */}
          <div className="pointer-events-none absolute inset-0 -z-20 bg-gradient-to-br from-[#0a0f24] via-[#0b112d] to-[#020611]" />

          {/* Cinematic orb */}
          <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.35]">
            <CinematicOrb size={900} />
          </div>

          {/* Soft vignette */}
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.75))]" />

          {/* NAV (conditionally rendered inside NavBar itself) */}
          <NavBar />

          {/* App content */}
          <main className="relative z-10">{children}</main>
        </HeadspaceProvider>
      </body>
    </html>
  );
}
