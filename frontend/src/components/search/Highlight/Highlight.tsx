import { stemWord } from "@/lib/search/text";

/** Wraps words whose stem is in `stems` in <mark>. */
export function Highlight({ text, stems }: { text: string; stems: Set<string> }) {
  const parts = text.split(/([A-Za-z0-9][A-Za-z0-9.+#-]*[A-Za-z0-9+#]|[A-Za-z0-9])/);
  return <>{parts.map((p, i) => (i % 2 === 1 && stems.has(stemWord(p)) ? <mark key={i}>{p}</mark> : p))}</>;
}
