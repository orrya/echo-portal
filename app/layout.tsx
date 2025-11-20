import "./globals.css";
import { Inter } from "next/font/google";
import CinematicOrb from "@/components/CinematicOrb";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Echo Suite Portal",
  description: "Dashboard for the Echo automation assistant.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="relative min-h-screen overflow-x-hidden text-white bg-[#060b1b]">
        
        {/* Orrya-style deep gradient */}
        <div
          className="
            pointer-events-none absolute inset-0 -z-20
            bg-gradient-to-br
            from-[#0a0f24]
            via-[#0b112d]
            to-[#020611]
          "
        />

        {/* Cinematic orb */}
        <div className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 -z-10 opacity-[0.35]">
          <CinematicOrb size={900} />
        </div>

        {/* Soft vignette */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.75))]" />

        {children}
      </body>
    </html>
  );
}
