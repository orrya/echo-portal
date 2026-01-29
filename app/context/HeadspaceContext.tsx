"use client";

import { createContext, useContext, useEffect, useState } from "react";

type HeadspaceMode = "quiet" | "aware" | "full";

type HeadspaceContextType = {
  mode: HeadspaceMode;
  setMode: (mode: HeadspaceMode) => void;
};

const HeadspaceContext = createContext<HeadspaceContextType | null>(null);

export function HeadspaceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setModeState] = useState<HeadspaceMode>("quiet");

  // Persist mode across reloads (important for trust)
  useEffect(() => {
    const stored = localStorage.getItem("echo:headspace");
    if (stored === "quiet" || stored === "aware" || stored === "full") {
      setModeState(stored);
    }
  }, []);

  const setMode = (newMode: HeadspaceMode) => {
    setModeState(newMode);
    localStorage.setItem("echo:headspace", newMode);
  };

  return (
    <HeadspaceContext.Provider value={{ mode, setMode }}>
      {children}
    </HeadspaceContext.Provider>
  );
}

export function useHeadspace() {
  const ctx = useContext(HeadspaceContext);
  if (!ctx) {
    throw new Error("useHeadspace must be used within HeadspaceProvider");
  }
  return ctx;
}
