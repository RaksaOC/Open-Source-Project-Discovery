"use client";

import { useState } from "react";
import { Onboarding } from "@/components/onboarding/Onboarding";
import { SAMPLE_SIZE } from "@/lib/preview/fakeSearch";
import type { DataSource } from "@/lib/search/types";
import { useHealth, type Health } from "@/lib/useHealth";
import { Select, type SelectOption } from "../Select";
import styles from "./SiteFooter.module.css";

function liveNote(h: Health) {
  if (h.state === "checking") return "Checking the API…";
  if (h.state === "offline") return "Offline: start the backend (port 8100)";
  return h.data.index_ready ? "Online · index ready" : "Online · index not built yet";
}

/** Footer on the search page: "How it works" (opens the tour as a dialog) and the data-source switch. */
export function SiteFooter({ source, onSource }: { source: DataSource; onSource: (s: DataSource) => void }) {
  const health = useHealth(30_000);
  const [tour, setTour] = useState(false);
  const options: SelectOption<DataSource>[] = [
    { value: "preview", label: "Preview data", description: `${SAMPLE_SIZE} made-up sample repositories with random ranking, to preview the app` },
    { value: "live", label: "Live API", description: liveNote(health), disabled: health.state !== "online" && source !== "live" },
  ];
  return (
    <footer className={styles.footer}>
      <button type="button" className={styles.link} onClick={() => setTour(true)}>
        How it works
      </button>
      <span aria-hidden="true">·</span>
      <span className={styles.source}>
        <span className={styles.dot} data-source={source} data-health={health.state} aria-hidden="true" />
        <Select value={source} options={options} onChange={onSource} label="Data source" variant="quiet" />
      </span>
      {tour && <Onboarding onClose={() => setTour(false)} />}
    </footer>
  );
}
