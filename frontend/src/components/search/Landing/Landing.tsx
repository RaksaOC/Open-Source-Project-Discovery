"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BOX_LAYOUT, EASE } from "@/lib/motion";
import { SearchBox } from "../SearchBox";
import styles from "./Landing.module.css";

/* "Try an example": a short chip label and the full query it runs. */
const EXAMPLES = [
  { label: "Beginner inventory system · NestJS", q: "Find a beginner-friendly inventory management system using NestJS and PostgreSQL" },
  { label: "Point of sale · React + Express", q: "simple point of sale app for a small shop with React and Express" },
  { label: "Real-time chat · Socket.IO", q: "real-time chat application using Socket.IO and MongoDB" },
  { label: "Hotel booking · Spring Boot", q: "hotel or room booking system built with Spring Boot and MySQL" },
  { label: "JWT auth API · FastAPI", q: "REST API boilerplate with JWT authentication in FastAPI" },
  { label: "Warehouse stock tracker", q: "warehouse stock tracker" },
];

interface LandingProps {
  input: string;
  onInput: (v: string) => void;
  onSubmit: (q: string) => void;
}

/** Start page. Rows are title | box | examples, with equal outer rows so the box stays centred. */
export function Landing({ input, onInput, onSubmit }: LandingProps) {
  const [showExamples, setShowExamples] = useState(false);
  return (
    <main className={styles.landing}>
      <motion.header className={styles.intro} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className={styles.title}>Describe the project you want to build.</h1>
        <p className={styles.subtitle}>Find open-source GitHub projects by what they do, the stack they use and your level.</p>
      </motion.header>

      <motion.div className={styles.box} layoutId="search-box" transition={BOX_LAYOUT}>
        <SearchBox value={input} onChange={onInput} onSubmit={onSubmit} size="lg" />
      </motion.div>

      <motion.div className={styles.below} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <button className={styles.tryBtn} onClick={() => setShowExamples((v) => !v)} aria-expanded={showExamples} aria-controls="examples">
          Try an example
          <svg className={styles.chev} viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <AnimatePresence>
          {showExamples && (
            <motion.div
              id="examples"
              className={styles.examples}
              initial="hide"
              animate="show"
              exit="hide"
              variants={{ show: { transition: { staggerChildren: 0.06 } }, hide: { transition: { staggerChildren: 0.03, staggerDirection: -1 } } }}
            >
              {EXAMPLES.map((x) => (
                <motion.button
                  key={x.q}
                  className={styles.example}
                  title={x.q}
                  onClick={() => onSubmit(x.q)}
                  variants={{ hide: { opacity: 0, y: -10, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1 } }}
                  transition={{ duration: 0.3, ease: EASE }}
                >
                  {x.label}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
