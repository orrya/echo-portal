import NavBar from "@/components/NavBar";
import { SupabaseProvider } from "@/components/SupabaseProvider";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SupabaseProvider>
      <NavBar />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12">
        {children}
      </main>
    </SupabaseProvider>
  );
}
