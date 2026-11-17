"use client";

import { motion } from "motion/react";
import { useEffect, useMemo, useRef } from "react";
import type { Method } from "@/lib/api/types";
import { cx } from "@/lib/cx";
import { capitalize, compact, monthYear } from "@/lib/format";
import { METHOD_INFO, techLabel } from "@/lib/search/labels";
import type { ResultView, SearchView } from "@/lib/search/types";
import ui from "@/components/ui/primitives/primitives.module.css";
import { Highlight } from "../Highlight";
import styles from "./RepoDrawer.module.css";

const TABLE_ORDER: Method[] = ["boolean", "tfidf", "bm25", "embedding", "hybrid"];

interface RepoDrawerProps {
  repo: ResultView;
  view: SearchView;
  onClose: () => void;
  onOpen: (name: string) => void;
}

/** Side panel with everything about one repository. */
export function RepoDrawer({ repo, view, onClose, onOpen }: RepoDrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const stems = useMemo(() => new Set(view.highlight), [view]);
  const inResults = view.results.some((r) => r.full_name === repo.full_name);
  const [owner, name] = repo.full_name.split("/");

  useEffect(() => {
    panel.current?.focus();
    panel.current?.scrollTo({ top: 0 });
  }, [repo.full_name]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      <motion.div className={styles.scrim} onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.div
        ref={panel}
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-label={repo.full_name}
        tabIndex={-1}
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%", transition: { duration: 0.25 } }}
      >
        <button className={styles.close} onClick={onClose} aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        <div className={styles.scroll}>
          <header className={styles.head}>
            <p className={styles.owner}>{owner} /</p>
            <h2 className={styles.title}>{name}</h2>
          </header>
          <p className={styles.desc}>{repo.description}</p>

          <div className={styles.stats}>
            <Stat k="Stars" v={compact(repo.stars)} />
            <Stat k="Forks" v={compact(repo.forks)} />
            <Stat k="Level" v={capitalize(repo.complexity)} />
            {repo.updated && <Stat k="Updated" v={monthYear(repo.updated)} />}
          </div>
          <div className={ui.chips}>
            {repo.technologies.map((t) => (
              <span key={t} className={cx(ui.chip, view.parsed?.technologies.includes(t) && ui.chipHit)}>
                {techLabel(t)}
              </span>
            ))}
          </div>

          {inResults && repo.reasons.length > 0 && (
            <Section title="Why it matched">
              <dl className={styles.reasons}>
                {repo.reasons.map((x) => (
                  <div key={x.label}>
                    <dt>{x.label}</dt>
                    <dd>{x.text}</dd>
                  </div>
                ))}
              </dl>
            </Section>
          )}
          {!inResults && <p className={ui.small}>This repository isn’t in the results for “{view.query}”.</p>}

          {inResults && repo.methodScores && repo.methodRanks && (
            <Section title="Score by method" note={`Text score for “${view.query}” under each method, and the rank it would get there.`}>
              <table className={styles.scores}>
                <tbody>
                  {TABLE_ORDER.map((m) => {
                    const v = repo.methodScores![m];
                    const rank = repo.methodRanks![m];
                    return (
                      <tr key={m} className={cx(m === view.method && styles.current)}>
                        <th>{METHOD_INFO[m].label}</th>
                        <td className={styles.barCell}>
                          {v === null ? (
                            <span className={ui.muted}>not returned</span>
                          ) : (
                            <span className={styles.bar}>
                              <motion.span initial={{ width: 0 }} animate={{ width: `${(m === "boolean" ? 1 : v) * 100}%` }} />
                            </span>
                          )}
                        </td>
                        <td className={styles.num}>{v === null ? "–" : m === "boolean" ? "match" : v.toFixed(2)}</td>
                        <td className={styles.num}>{rank ? `#${rank}` : ""}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Section>
          )}

          {repo.readme && (
            <Section title="README">
              <div className={styles.readme}>
                <p className={styles.readmeTitle}># {name}</p>
                <p>
                  <Highlight text={repo.readme} stems={stems} />
                </p>
                {repo.topics.length > 0 && (
                  <div className={ui.chips}>
                    {repo.topics.map((t) => (
                      <span key={t} className={styles.topic}>
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Section>
          )}

          {repo.related.length > 0 && (
            <Section title="Related projects" note="Linked by shared contributors, forks or README links in the repository graph.">
              <ul className={styles.related}>
                {repo.related.map((x) => (
                  <li key={x.full_name}>
                    <button onClick={() => onOpen(x.full_name)}>
                      <b>{x.full_name.split("/")[1]}</b>
                      <span>{x.description}</span>
                      <span className={ui.muted}>
                        ★ {compact(x.stars)} · {x.complexity}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <footer className={styles.foot}>
            {view.source === "live" ? (
              <a className={cx(ui.btn, ui.primary)} href={repo.url} target="_blank" rel="noreferrer">
                Open on GitHub ↗
              </a>
            ) : (
              <>
                <span className={cx(ui.btn, ui.primary)} aria-disabled="true" title="Sample data: this repository doesn't exist on GitHub">
                  Open on GitHub ↗
                </span>
                <span className={ui.small}>Sample repository, not a real link.</span>
              </>
            )}
          </footer>
        </div>
      </motion.div>
    </>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className={styles.section}>
      <h3 className={styles.h3}>{title}</h3>
      {note && <p className={ui.small}>{note}</p>}
      {children}
    </section>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div className={styles.stat}>
      <b>{v}</b>
      <span>{k}</span>
    </div>
  );
}
