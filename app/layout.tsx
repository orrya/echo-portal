import "./globals.css";
import { Inter } from "next/font/google";
import CinematicOrb from "@/components/CinematicOrb";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata = {
  title: "Echo Suite Portal",
  description: "Dashboard for the Echo automation assistant.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} font-sans`}>
      <body className="relative min-h-screen overflow-x-hidden text-white">
        {/* Orrya cinematic gradient background */}
        <div
          className="
            pointer-events-none absolute inset-0 -z-20
            bg-[radial-gradient(circle_at_22%_8%,rgba(168,110,255,0.35),transparent_62%),
                radial-gradient(circle_at_88%_78%,rgba(80,180,255,0.22),transparent_70%),
                linear-gradient(
                  to_bottom,
                  #0E0B14 0%,
                  #120F1C 20%,
                  #1A1528 46%,
                  #0F0D18 72%,
                  #09070F 100%
                )]
          "
        />

        {/* Cinematic orb sitting behind content */}
        <div className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2 -z-10">
          <CinematicOrb size={800} />
        </div>

        {/* Subtle vignette */}
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent,rgba(0,0,0,0.55))]" />

        {children}
      </body>
    </html>
  );
}
