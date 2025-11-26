"use client";

import { useEffect } from "react";

export function DashboardClientWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 🔥 Trigger subscription creation AFTER cookie exists
    fetch("/api/ms-subscription", { method: "POST" });
  }, []);

  return <>{children}</>;
}
