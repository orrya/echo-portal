export const dynamic = "force-dynamic";

import type { ReactNode } from "react";


export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      
      <div className="flex-1 pt-4 pb-10">{children}</div>
    </div>
  );
}
