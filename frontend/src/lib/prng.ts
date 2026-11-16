/** Small seeded PRNG so the illustrative animations render the same on server and client. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const bit = (rand: () => number) => (rand() < 0.5 ? 0 : 1);

export function randomHex(rand: () => number, bytes: number): number[] {
  return Array.from({ length: bytes }, () => Math.floor(rand() * 256));
}

export const toHex = (bytes: number[]) => bytes.map((b) => b.toString(16).padStart(2, "0")).join("");

export const xorBytes = (...parts: number[][]) =>
  parts[0].map((_, i) => parts.reduce((acc, p) => acc ^ p[i], 0));
