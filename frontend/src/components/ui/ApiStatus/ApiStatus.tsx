"use client";

import { cx } from "@/lib/cx";
import { useHealth } from "@/lib/useHealth";
import styles from "./ApiStatus.module.css";

export function ApiStatus() {
  const health = useHealth();
  const label =
    health.state === "online"
      ? `API online · ${health.data.index_ready ? "index ready" : "index not built"}`
      : health.state === "offline"
        ? "API offline"
        : "Checking API…";
  return (
    <span className={styles.status} title="FastAPI backend at /api/health" aria-live="polite">
      <span className={cx(styles.dot, health.state === "online" && styles.dotOn, health.state === "offline" && styles.dotOff)} />
      {label}
    </span>
  );
}
