import CalendarClient from "./CalendarClient";

export default async function CalendarPage() {
  const todayRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/today`,
    { cache: "no-store" }
  );

  const tomorrowRes = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL}/api/calendar/tomorrow`,
    { cache: "no-store" }
  );

  const { snapshot: todaySnapshot } = await todayRes.json();
  const { snapshot: tomorrowSnapshot } = await tomorrowRes.json();

  return (
    <div className="min-h-screen bg-slate-950 pb-20">
      <CalendarClient
        snapshot={todaySnapshot}
        tomorrowSnapshot={tomorrowSnapshot}
      />
    </div>
  );
}
