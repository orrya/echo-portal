import "@/app/globals.css";
import NavBar from "@/components/NavBar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import CinematicOrb from "@/components/CinematicOrb";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <div className="relative min-h-screen overflow-x-hidden bg-[#0E0B14] text-white">

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

        {/* Orrya Cinematic Orb */}
        <div
          className="
            pointer-events-none absolute left-1/2 top-[42%]
            -translate-x-1/2 -translate-y-1/2 z-[-10]
          "
        >
          <CinematicOrb size={760} />
        </div>

        {/* Navigation */}
        <NavBar />

        {/* Page content */}
        <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
          {children}
        </main>

      </div>
    </SupabaseProvider>
  );
}
