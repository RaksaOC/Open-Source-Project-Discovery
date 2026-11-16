"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { STEPS } from "@/content/steps";
import { SCENES } from "@/components/scenes";
import { ApiStatus } from "@/components/ui/ApiStatus";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { cx } from "@/lib/cx";
import styles from "./Onboarding.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

export function Onboarding() {
  // null until mounted: the hash (#rank) is only known in the browser, so the first client
  // render picks the right step instead of mounting the intro and animating away from it.
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    setIndex(Math.max(0, STEPS.findIndex((s) => `#${s.id}` === window.location.hash)));
  }, []);
  if (index === null) return <div style={{ minHeight: "100dvh" }} />;
  return <Tour initial={index} />;
}

function Tour({ initial }: { initial: number }) {
  const [index, setIndex] = useState(initial);
  const [direction, setDirection] = useState(1);
  const step = STEPS[index];
  const Scene = SCENES[step.id];
  const last = index === STEPS.length - 1;

  const go = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(STEPS.length - 1, next));
    setIndex((current) => {
      setDirection(clamped >= current ? 1 : -1);
      return clamped;
    });
  }, []);

  useEffect(() => {
    history.replaceState(null, "", index === 0 ? window.location.pathname : `#${step.id}`);
  }, [index, step.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  return (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease }}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <a className={styles.brand} href="#" onClick={(e) => (e.preventDefault(), go(0))}>
            <BrandMark />
            <span>Discovery Engine</span>
          </a>
          <div className={styles.headerRight}>
            <span className={styles.tag}>IR · Group 6</span>
            <ApiStatus />
            <ThemeToggle />
          </div>
        </header>

        <main className={styles.main}>
          <section className={styles.copy} aria-live="polite">
            <AnimatePresence mode="wait" custom={direction} initial={false}>
              <motion.div
                key={step.id}
                custom={direction}
                initial={{ opacity: 0, x: direction * 28 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction * -28, transition: { duration: 0.22 } }}
              >
                <p className={styles.eyebrow}>{step.eyebrow}</p>
                <h1 className={cx(styles.title, index === 0 && styles.titleHero)}>{step.title}</h1>
                <p className={styles.lead}>{step.lead}</p>
                <ul className={styles.points}>
                  {step.points.map((point, i) => (
                    <motion.li
                      key={point}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                    >
                      {point}
                    </motion.li>
                  ))}
                </ul>
                {step.note && <p className={styles.note}>{step.note}</p>}
                {step.hint && (
                  <p className={styles.hint}>
                    <span aria-hidden="true">→</span> {step.hint}
                  </p>
                )}
              </motion.div>
            </AnimatePresence>
          </section>

          <section className={styles.stage} aria-label={`${step.label} illustration`}>
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={step.id}
                className={styles.stageInner}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.2 } }}
              >
                <Scene />
              </motion.div>
            </AnimatePresence>
          </section>
        </main>

        <footer className={styles.footer}>
          <nav className={styles.rail} style={{ gridTemplateColumns: `repeat(${STEPS.length}, minmax(0, 1fr))` }} aria-label="Tour steps">
            {STEPS.map((s, i) => (
              <button
                key={s.id}
                className={cx(styles.railItem, i === index && styles.railActive, i < index && styles.railDone)}
                onClick={() => go(i)}
                aria-current={i === index ? "step" : undefined}
              >
                <span className={styles.railBar}>
                  {i === index && <motion.span layoutId="rail-fill" className={styles.railFill} />}
                </span>
                <span className={styles.railLabel}>{s.label}</span>
              </button>
            ))}
          </nav>
          <div className={styles.nav}>
            <button className={styles.ghostBtn} onClick={() => go(index - 1)} disabled={index === 0}>
              Back
            </button>
            <span className={styles.counter}>
              {String(index + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}
            </span>
            <button className={styles.primaryBtn} onClick={() => go(last ? 0 : index + 1)}>
              {last ? "Start over" : index === 0 ? "Start the tour" : "Next"}
            </button>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}

function BrandMark() {
  return (
    <svg viewBox="0 0 28 28" width="26" height="26" aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="var(--accent)" strokeWidth="2" />
      <path d="m18.2 18.2 6.3 6.3" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M8.2 10.2h7.6M8.2 13.8h5" stroke="var(--ink)" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
