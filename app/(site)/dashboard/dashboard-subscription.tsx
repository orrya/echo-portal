"use client";
import { useEffect } from "react";

export default function DashboardSubscription() {
  useEffect(() => {
    fetch("/api/ms-subscription", { method: "POST" });
  }, []);

  return null; // nothing rendered
}
