"use client";

import { motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect } from "react";
import clsx from "clsx";

type CinematicOrbProps = {
  size?: number;
  className?: string;
  intensity?: number;
  glow?: number;
};

export default function CinematicOrb({
  size = 820,
  className,
}: CinematicOrbProps) {
  // --- Parallax Motion ---
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 12;
      const y = (e.clientY / window.innerHeight - 0.5) * 12;
      tiltX.set(y);
      tiltY.set(x);
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [tiltX, tiltY]);

  const rotateX = useTransform(tiltX, (v) => v);
  const rotateY = useTransform(tiltY, (v) => v);

  return (
    <motion.div
      style={{
        width: size,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={clsx(
        "pointer-events-none relative aspect-square select-none",
        className
      )}
      animate={{ scale: [1, 1.015, 1] }}
      transition={{
        duration: 16,
        repeat: Infinity,
        repeatType: "mirror",
        ease: "easeInOut",
      }}
    >
      {/* MASK FIX (kills the square artifact completely) */}
      <div className="absolute inset-0 rounded-full overflow-hidden">

        {/* BLOOM HALO */}
        <motion.div
          className="
            absolute inset-[-18%] rounded-full
            bg-[radial-gradient(circle,rgba(227,216,255,0.16)_0%,rgba(227,216,255,0)_70%)]
            blur-[130px]
          "
          animate={{ opacity: [0.18, 0.28, 0.18] }}
          transition={{
            duration: 18,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />

        {/* CORE GLOW */}
        <div
          className="
            absolute inset-0 rounded-full
            bg-[radial-gradient(
              circle_at_center,
              rgba(227,216,255,0.95)_0%,
              rgba(227,216,255,0.7)_12%,
              rgba(199,178,255,0.78)_28%,
              rgba(189,140,248,0.67)_46%,
              rgba(96,165,250,0.54)_78%,
              rgba(15,23,42,0.65)_100%
            )]
          "
        />

        {/* INNER VIGNETTE */}
        <div
          className="
            absolute inset-[10%] rounded-full
            bg-[radial-gradient(circle,rgba(0,0,0,0)_40%,rgba(0,0,0,0.58)_100%)]
            opacity-70 mix-blend-multiply
          "
        />

        {/* LIGHT + SHADOW */}
        <div
          className="
            absolute inset-0 rounded-full
            bg-[radial-gradient(circle_at_24%_20%,rgba(255,255,255,0.35)_0%,rgba(255,255,255,0)_45%),
                radial-gradient(circle_at_82%_86%,rgba(15,23,42,0.9)_0%,rgba(15,23,42,0)_55%)]
            mix-blend-soft-light opacity-80
          "
        />

        {/* SPECULAR HIGHLIGHT */}
        <div
          className="
            absolute left-[28%] top-[26%] w-[26%] h-[26%] rounded-full
            bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.9)_0%,rgba(255,255,255,0)_70%)]
            blur-[25px] opacity-75
          "
        />

        {/* CHROMATIC RIM */}
        <div
          className="absolute inset-[9%] rounded-full border border-[rgba(210,225,255,0.33)]"
          style={{
            boxShadow:
              "0 0 50px rgba(164,196,255,0.45), 0 0 110px rgba(56,189,248,0.32)",
          }}
        />

        {/* ROTATING SHELL */}
        <motion.div
          className="
            absolute inset-[6%] rounded-full mix-blend-screen
            bg-[conic-gradient(
              from_210deg,
              rgba(244,114,182,0.24),
              rgba(168,85,247,0.24),
              rgba(56,189,248,0.28),
              rgba(244,114,182,0.24)
            )]
            blur-[55px]
          "
          animate={{ rotate: [0, 9, 0] }}
          transition={{
            duration: 75,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* OUTER SHADOW */}
        <div
          className="
            absolute inset-0 rounded-full
            bg-[radial-gradient(circle,rgba(0,0,20,0)_62%,rgba(0,0,20,0.7)_100%)]
            opacity-70
          "
        />

        {/* MICRO GRAIN (still inside mask → no more square) */}
        <div
          className="
            absolute inset-0 rounded-full opacity-[0.08] mix-blend-soft-light
            bg-[url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220%200%204%204%22%3E%3Ccircle cx=%221%22 cy=%221%22 r=%220.45%22 fill=%22white%22 opacity=%220.3%22/%3E%3C/svg%3E')]
            bg-[length:4px_4px]
          "
        />
      </div>
    </motion.div>
  );
}