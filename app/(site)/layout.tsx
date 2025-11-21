import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { getUser } from "@/lib/getUser"; 
import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = headers();
  const pathname = headersList.get("x-pathname") || "/";

  // 1. Bypass check for Auth pages (prevents infinite loop on /auth/sign-in)
  if (pathname.startsWith("/auth")) {
    return (
      <SupabaseProvider>
        <main className="relative z-10 w-full min-h-screen text-slate-200">
          {children}
        </main>
      </SupabaseProvider>
    );
  }

  // 2. Standard Supabase Session Check for Protected Routes
  const user = await getUser();

  if (!user) {
    // Redirect if the user is not authenticated on a protected page
    console.log("LAYOUT CHECK: User not found. Redirecting to sign-in.");
    redirect("/auth/sign-in");
  }

  // 3. Render Protected Content
  return (
    <SupabaseProvider>
      <NavBar />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 text-slate-200">
        {children}
      </main>
    </SupabaseProvider>
  );
}