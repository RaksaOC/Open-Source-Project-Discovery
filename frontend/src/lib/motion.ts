/** Shared easing for motion transitions (matches --ease in globals.css). */
export const EASE = [0.22, 1, 0.36, 1] as const;

/** Shared layout transition for the search box gliding between the landing page and results. */
export const BOX_LAYOUT = { layout: { duration: 0.55, ease: EASE } } as const;
