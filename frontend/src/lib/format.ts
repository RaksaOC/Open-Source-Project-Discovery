export const capitalize = (x: string) => (x ? x[0].toUpperCase() + x.slice(1) : x);

/** 1840 -> "1.8k", 12400 -> "12k". */
export const compact = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

/** "2026-10-02" -> "Oct 2026". */
export const monthYear = (iso: string) => new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { month: "short", year: "numeric" });
