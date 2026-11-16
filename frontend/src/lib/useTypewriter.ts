"use client";

import { useEffect, useState } from "react";

/** Types each line, pauses, deletes it, then moves on. With reduced motion it swaps whole lines. */
export function useTypewriter(lines: string[], on: boolean) {
  const [text, setText] = useState("");
  useEffect(() => {
    if (!on) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0;
    let n = 0;
    let deleting = false;
    let timer = 0;
    const next = (ms: number) => (timer = window.setTimeout(tick, ms));
    function tick() {
      const line = lines[i];
      if (reduce) {
        setText(line);
        i = (i + 1) % lines.length;
        return next(3200);
      }
      n += deleting ? -1 : 1;
      setText(line.slice(0, n) + "|");
      if (!deleting && n === line.length) {
        deleting = true;
        return next(1900);
      }
      if (deleting && n === 0) {
        deleting = false;
        i = (i + 1) % lines.length;
        return next(400);
      }
      next(deleting ? 16 : 38 + Math.random() * 55);
    }
    next(600);
    return () => window.clearTimeout(timer);
  }, [lines, on]);
  return text;
}
