"use client";

import { AnimatePresence, MotionConfig, motion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { STEPS } from "@/content/steps";
import { SCENES } from "@/components/scenes";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { cx } from "@/lib/cx";
import styles from "./Onboarding.module.css";

const ease = [0.22, 1, 0.36, 1] as const;

/** The tour. As a page at /tour, or (with onClose) as a centred dialog over the current page. */
export function Onboarding({ onClose }: { onClose?: () => void } = {}) {
  const dialog = !!onClose;
  // null until mounted: the hash (#rank) is only known in the browser, so the first client
  // render picks the right step instead of mounting the intro and animating away from it.
  const [index, setIndex] = useState<number | null>(null);
  useEffect(() => {
    setIndex(
      dialog
        ? 0
        : Math.max(
            0,
            STEPS.findIndex((s) => `#${s.id}` === window.location.hash),
          ),
    );
  }, [dialog]);
  if (index === null) return dialog ? null : <div style={{ minHeight: "100dvh" }} />;
  return <Tour initial={index} onClose={onClose} />;
}

function Tour({ initial, onClose }: { initial: number; onClose?: () => void }) {
  const dialog = !!onClose;
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

  // the /tour page keeps the step in the URL (#rank); the dialog leaves the URL alone
  useEffect(() => {
    if (dialog) return;
    history.replaceState(null, "", index === 0 ? window.location.pathname : `#${step.id}`);
  }, [dialog, index, step.id]);

  // dialog: no page scrolling behind it
  useEffect(() => {
    if (!dialog) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, [dialog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, select")) return;
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index, onClose]);

  const tour = (
    <MotionConfig reducedMotion="user" transition={{ duration: 0.5, ease }}>
      <div className={cx(styles.shell, dialog && styles.inDialog)}>
        {dialog ? (
          <div className={styles.dialogHead}>
            <span className={styles.dialogLabel}>How it works</span>
            <button className={styles.dialogClose} onClick={onClose} aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
        ) : (
          <SiteHeader />
        )}

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
                    <motion.li key={point} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.08 }}>
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
                <span className={styles.railBar}>{i === index && <motion.span layoutId="rail-fill" className={styles.railFill} />}</span>
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
            {last && dialog ? (
              <button className={styles.primaryBtn} onClick={onClose}>
                Try the search
              </button>
            ) : last ? (
              <Link className={styles.primaryBtn} href="/">
                Try the search
              </Link>
            ) : (
              <button className={styles.primaryBtn} onClick={() => go(index + 1)}>
                {index === 0 ? "Start the tour" : "Next"}
              </button>
            )}
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
  if (!dialog) return tour;
  return createPortal(
    <motion.div className={styles.overlay} initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <motion.div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-label="How it works"
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease }}
      >
        {tour}
      </motion.div>
    </motion.div>,
    document.body,
  );
}
