// app/(site)/calendar/page.tsx
import CalendarClient from "./CalendarClient";

async function getCalendarSnapshot() {
  // Use absolute URL so it works on Vercel
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/calendar/today`, {
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("Failed to load calendar snapshot");
    return null;
  }

  const { snapshot } = await res.json();
  return snapshot ?? null;
}

export default async function CalendarPage() {
  const snapshot = await getCalendarSnapshot();
  return <CalendarClient snapshot={snapshot} />;
}
