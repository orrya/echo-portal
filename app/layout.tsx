// app/(site)/layout.tsx
import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { getUserFromSession } from "@/lib/getUserFromSession";
import { redirect } from "next/navigation";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await getUserFromSession();

  // If no session → send to sign-in
  if (!user) {
    redirect("/auth/sign-in");
  }

  // If you want the NavBar to know about the user later,
  // you can pass it via props or context; for now we just render.
  return (
    <SupabaseProvider>
      <NavBar />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 text-slate-200">
        {children}
      </main>
    </SupabaseProvider>
  );
}
