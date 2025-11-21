// app/(site)/layout.tsx
import type { ReactNode } from "react";
import NavBar from "@/components/NavBar";

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <div className="flex-1 pt-4 pb-10">
        {children}
      </div>
    </div>
  );
}
