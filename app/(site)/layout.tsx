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
      <main className="p-4 container mx-auto">{children}</main>
    </SupabaseProvider>
  );
}
