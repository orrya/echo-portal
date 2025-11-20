"use client";

import { motion } from "framer-motion";

export default function DashboardPage() {
  return (
    <div className="text-slate-200 space-y-8">

      {/* Branded headline */}
      <motion.h1
        className="
          text-4xl sm:text-5xl font-semibold
          bg-gradient-to-r from-fuchsia-400 via-violet-400 to-sky-400
          bg-clip-text text-transparent
          drop-shadow-[0_0_18px_rgba(129,140,248,0.35)]
        "
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        Dashboard
      </motion.h1>

      <p className="text-lg opacity-90">
        You are logged in 🎉
      </p>

      <p className="text-slate-300 max-w-xl leading-relaxed">
        Your personalised Echo insights will appear here.  
        This is your control panel for summaries, email intelligence and daily optimisation.
      </p>

    </div>
  );
}
