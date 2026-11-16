/** Light plural stemmer shared by the preview engine and highlighting: "systems" -> "system". */
export function stem(w: string) {
  w = w.toLowerCase();
  if (w.length > 4 && w.endsWith("ies")) return w.slice(0, -3) + "y";
  if (w.length > 3 && w.endsWith("s") && !w.endsWith("ss") && !w.endsWith("us")) return w.slice(0, -1);
  return w;
}

/** Stem of a word as it appears in running text (punctuation trimmed). */
export const stemWord = (w: string) => stem(w.toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""));
