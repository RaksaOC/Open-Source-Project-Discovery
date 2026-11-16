"use client";

import { useEffect, useState } from "react";
import { api } from "./api/client";
import type { Health as HealthBody } from "./api/types";

export type Health = { state: "checking" } | { state: "online"; data: HealthBody } | { state: "offline" };

/** Polls GET /api/health so the UI can show whether the search API is up. */
export function useHealth(intervalMs = 10_000): Health {
  const [health, setHealth] = useState<Health>({ state: "checking" });
  useEffect(() => {
    let alive = true;
    const check = () =>
      api
        .health()
        .then((data) => alive && setHealth({ state: "online", data }))
        .catch(() => alive && setHealth({ state: "offline" }));
    check();
    const id = window.setInterval(check, intervalMs);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [intervalMs]);
  return health;
}
