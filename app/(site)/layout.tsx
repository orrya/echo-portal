import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import { SupabaseProvider } from "@/components/SupabaseProvider";
import { getUserFromSession } from "@/lib/getUserFromSession";
import { redirect } from "next/navigation";
import { headers } from "next/headers"; // Import headers for path check

export default async function SiteLayout({
  children,
}: {
  children: ReactNode;
}) {
  const headersList = headers();
  // Get the pathname from the request headers. This is a robust way to get the path in a Server Component.
  const pathname = headersList.get("x-pathname") || "/";

  // If the user is currently on an authentication page, we must NOT run the redirect check.
  // This prevents the infinite loop when accessing /auth/sign-in.
  if (pathname.startsWith("/auth")) {
    // Render the auth pages with minimal wrapping, skipping the session check/redirect.
    return (
      <SupabaseProvider>
        {/* We can still render the NavBar here, or let the auth layout handle it */}
        <main className="relative z-10 w-full min-h-screen text-slate-200">
          {children}
        </main>
      </SupabaseProvider>
    );
  }

  // --- START: Authentication Check for PROTECTED ROUTES ---
  const user = await getUserFromSession();

  // If no session → send to sign-in. This only runs if we are NOT on an /auth page.
  if (!user) {
    // If the check fails here, we are on a protected page (like /) and need to redirect.
    console.log("LAYOUT CHECK: User not found. Redirecting from protected route.");
    redirect("/auth/sign-in");
  }
  // --- END: Authentication Check for PROTECTED ROUTES ---

  // If session is found AND we are on a protected page, render the full site structure.
  return (
    <SupabaseProvider>
      <NavBar />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-12 text-slate-200">
        {children}
      </main>
    </SupabaseProvider>
  );
}