"use client";

import { useEffect, useState } from "react";

/** Counts 0, 1, 2 … every `ms`, wrapping at `loop` when given. Drives the scene timelines. */
export function useTicker(ms: number, loop?: number, paused = false): number {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setTick((t) => (loop ? (t + 1) % loop : t + 1));
    }, ms);
    return () => window.clearInterval(id);
  }, [ms, loop, paused]);
  return tick;
}
