"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import CinematicOrb from "@/components/CinematicOrb";
import Image from "next/image";

export default function DashboardPage() {
  // Mouse parallax (same as homepage)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const sx = useSpring(mouseX, { stiffness: 22, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 22, damping: 20 });

  const orbX = useTransform(sx, [-400, 400], [-22, 22]);
  const orbY = useTransform(sy, [-260, 260], [-18, 18]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };

  return (
    <div
      className="relative min-h-screen"
      onMouseMove={handleMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* Moving orb */}
      <motion.div
        className="pointer-events-none absolute left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2 z-[1]"
        style={{ x: orbX, y: orbY }}
        animate={{ scale: [1, 1.015, 1], opacity: [0.98, 1, 0.98] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <CinematicOrb size={760} />
      </motion.div>

      <main className="relative z-10 max-w-6xl mx-auto px-6 pt-32 pb-24 space-y-14">

        {/* TOP TITLE */}
        <div className="space-y-3">
          <p className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90">
            ORRYA · QUIET INTELLIGENCE
          </p>

          <h1 className="text-white text-4xl sm:text-5xl font-semibold leading-tight">
            Quiet tools for{" "}
            <span className="bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)] bg-clip-text text-transparent">
              louder thinking.
            </span>
          </h1>

          <p className="text-slate-300/90 text-lg pt-2">
            Your personalised Echo dashboard — built around clarity, calm and high-signal work.
          </p>
        </div>

        {/* DASHBOARD CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              Today’s Summary
            </h2>
            <p className="text-slate-300">
              Your daily summary will appear here once connected to n8n.
            </p>
          </div>

          <div className="glass-panel p-6 rounded-2xl">
            <h2 className="text-xl font-semibold text-white mb-2">
              Email Intelligence
            </h2>
            <p className="text-slate-300">
              Your email classifications, priorities & insights will show here.
            </p>
          </div>

        </div>

        {/* FOOTER SIGNATURE */}
        <div className="flex items-center gap-3 pt-6 opacity-80">
          <Image
            src="/brand/orrya-logo.png"
            width={42}
            height={42}
            alt="Orrya"
          />
          <span className="text-slate-400 text-sm tracking-wide">
            Designed by Orrya · The Quiet Intelligence Layer.
          </span>
        </div>
      </main>
    </div>
  );
}
