"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import CinematicOrb from "@/components/CinematicOrb";

export default function HomePage() {
  // Mouse parallax
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const sx = useSpring(mouseX, { stiffness: 22, damping: 20 });
  const sy = useSpring(mouseY, { stiffness: 22, damping: 20 });

  // Elegant, limited ranges
  const orbX = useTransform(sx, [-400, 400], [-22, 22]);
  const orbY = useTransform(sy, [-260, 260], [-18, 18]);

  const bgX = useTransform(sx, [-400, 400], [-10, 10]);
  const bgY = useTransform(sy, [-260, 260], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - (rect.left + rect.width / 2));
    mouseY.set(e.clientY - (rect.top + rect.height / 2));
  };

  return (
    <div
      className="relative min-h-screen overflow-visible"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        mouseX.set(0);
        mouseY.set(0);
      }}
    >
      {/* -------------------------------------------------------------------------------- */}
      {/* BACKGROUND FIELD — cinematic, quiet, fixed block issue */}
      {/* -------------------------------------------------------------------------------- */}
    <motion.div
  className="pointer-events-none absolute inset-0 z-[0]"
  style={{ x: bgX, y: bgY }}
>
  <div
    className="
      absolute inset-0
      bg-[radial-gradient(circle_at_22%_8%,rgba(168,110,255,0.35),transparent_62%),
          radial-gradient(circle_at_88%_78%,rgba(80,180,255,0.22),transparent_70%),
          linear-gradient(
            to_bottom,
            #0E0B14 0%,
            #120F1C 20%,
            #1A1528 46%,
            #0F0D18 72%,
            #09070F 100%
          )]
    "
  />
</motion.div>

      {/* -------------------------------------------------------------------------------- */}
      {/* ORB LAYER */}
      {/* -------------------------------------------------------------------------------- */}
      <motion.div
        className="
          pointer-events-none select-none
          absolute left-1/2 top-[44%]
          -translate-x-1/2 -translate-y-1/2
          z-[4] overflow-visible
        "
        style={{ x: orbX, y: orbY }}
        animate={{
          scale: [1, 1.01, 1],
          opacity: [0.98, 1, 0.98],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
      >
        <CinematicOrb size={800} />
      </motion.div>

      {/* Soft vignette behind text */}
      <div
        className="
          pointer-events-none absolute inset-x-0 top-0 z-[3]
          h-[60vh]
          bg-[radial-gradient(circle_at_left,rgba(15,23,42,0.85),transparent_65%)]
        "
      />

      {/* -------------------------------------------------------------------------------- */}
      {/* HERO TEXT */}
      {/* -------------------------------------------------------------------------------- */}
      <section className="relative z-10 mx-auto flex min-h-[78vh] max-w-6xl items-center px-6 pt-28 pb-10">
        <motion.div
          className="max-w-2xl space-y-10"
          initial={{ opacity: 0, y: 22, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Label */}
          <motion.p
            className="text-[11px] font-semibold tracking-[0.28em] text-slate-300/90"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            ORRYA · QUIET INTELLIGENCE
          </motion.p>

          {/* Headline */}
          <motion.h1
            className="
              text-white text-4xl sm:text-5xl lg:text-[3.4rem]
              font-semibold leading-[1.05]
              drop-shadow-[0_0_18px_rgba(0,0,0,0.45)]
            "
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.32, duration: 0.7 }}
          >
            Quiet tools for{" "}
            <span
              className="
                bg-[linear-gradient(120deg,#f9a8ff,#c4b5fd,#38bdf8)]
                bg-clip-text text-transparent
                drop-shadow-[0_0_22px_rgba(129,140,248,0.55)]
              "
            >
              louder thinking.
            </span>
          </motion.h1>

          {/* Subcopy */}
          <motion.p
            className="max-w-xl text-slate-200/95 sm:text-lg leading-relaxed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42, duration: 0.6 }}
          >
            Echo is the first Orrya companion. It sits above your inbox and
            calendar, understands what truly matters, and quietly reshapes your
            day around a handful of high-signal conversations.
          </motion.p>

          {/* CTA Row */}
          <motion.div
            className="flex flex-wrap items-center gap-4 pt-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.52, duration: 0.55 }}
          >
            <Link
              href="/echo"
              className="
                inline-flex items-center justify-center rounded-full
                bg-gradient-to-r from-fuchsia-500 via-violet-500 to-sky-500
                px-6 py-2.5 text-sm font-medium text-white
                shadow-[0_0_28px_rgba(129,140,248,0.65)]
                hover:shadow-[0_0_44px_rgba(129,140,248,0.9)]
                transition-all
              "
            >
              Explore Echo ↗
            </Link>

            <Link
              href="/waitlist"
              className="
                inline-flex items-center justify-center rounded-full
                border border-white/15 bg-white/5
                px-6 py-2.5 text-sm font-medium text-slate-200
                backdrop-blur-md
                hover:border-fuchsia-400/60 hover:bg-white/10
                transition-all
              "
            >
              Join the waitlist
            </Link>
          </motion.div>

          {/* Signature */}
          <motion.div
            className="flex items-center gap-3 text-[13px] text-slate-300/80 pt-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.55 }}
          >
            <Image
              src="/brand/orrya-logo.png"
              width={42}
              height={42}
              alt="Orrya"
              className="opacity-90"
            />
            <span className="tracking-wide">
              Designed by Orrya · The Quiet Intelligence Layer.
            </span>
          </motion.div>
        </motion.div>
      </section>

      {/* -------------------------------------------------------------------------------- */}
      {/* SCROLL CUE */}
      {/* -------------------------------------------------------------------------------- */}
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 0.55, y: 0 }}
          transition={{ delay: 1.1, duration: 0.6 }}
          className="flex flex-col items-center text-[11px] uppercase tracking-[0.22em] text-slate-400/80"
        >
          <span>Explore Orrya</span>
          <span className="mt-2 h-7 w-px bg-gradient-to-b from-slate-400/70 to-transparent" />
        </motion.div>
      </div>
    </div>
  );
}