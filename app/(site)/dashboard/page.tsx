"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-10">
      {/* Page Header */}
      <div className="space-y-3">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400 text-transparent bg-clip-text drop-shadow-lg">
          Dashboard
        </h1>

        <p className="text-lg text-slate-300">
          Welcome back. Your personalised Echo insights will appear here.
        </p>
      </div>

      {/* Placeholder cards (until live data flows in) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
          <h2 className="text-2xl font-semibold text-fuchsia-300 mb-2">
            Today&apos;s Summary
          </h2>
          <p className="text-slate-400">
            Your daily summary will appear here once connected to n8n.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-white/5 backdrop-blur-lg border border-white/10 shadow-xl">
          <h2 className="text-2xl font-semibold text-fuchsia-300 mb-2">
            Email Intelligence
          </h2>
          <p className="text-slate-400">
            Your email classifications, priorities & insights will show here.
          </p>
        </div>

      </div>
    </div>
  );
}
