"use client";

export default function DashboardPage() {
  return (
    <div className="space-y-12">

      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-6xl font-semibold tracking-tight 
          bg-gradient-to-r from-white via-white/90 to-white/70 
          text-transparent bg-clip-text drop-shadow-[0_0_25px_rgba(255,255,255,0.08)]"
        >
          Dashboard
        </h1>

        <p className="text-[1.15rem] text-white/70 leading-relaxed">
          Welcome back. Your personalised Echo insights will appear here.
        </p>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

        <div
          className="
            p-7 rounded-3xl
            bg-white/5 
            border border-white/10 
            backdrop-blur-xl 
            shadow-[0_0_30px_rgba(0,0,0,0.25)]
            hover:shadow-[0_0_45px_rgba(70,140,255,0.22)]
            transition-all duration-300
          "
        >
          <h2 className="text-3xl font-semibold 
            bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300 
            text-transparent bg-clip-text mb-3"
          >
            Today’s Summary
          </h2>

          <p className="text-white/60 text-[1.05rem] leading-relaxed">
            Your daily summary will appear here once connected to.
          </p>
        </div>

        <div
          className="
            p-7 rounded-3xl
            bg-white/5 
            border border-white/10 
            backdrop-blur-xl
            shadow-[0_0_30px_rgba(0,0,0,0.25)]
            hover:shadow-[0_0_45px_rgba(70,140,255,0.22)]
            transition-all duration-300
          "
        >
          <h2 className="text-3xl font-semibold
            bg-gradient-to-r from-fuchsia-300 via-violet-300 to-sky-300
            text-transparent bg-clip-text mb-3"
          >
            Email Intelligence
          </h2>

          <p className="text-white/60 text-[1.05rem] leading-relaxed">
            Your email classifications, priorities & insights will show here.
          </p>
        </div>

      </div>
    </div>
  );
}
