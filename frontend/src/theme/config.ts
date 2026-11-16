/* Internal theme switch. Each look is one CSS file in this folder, keyed by data-look on
   <html>. There is deliberately no theme picker in the UI: add a look as ./<id>.css,
   import it in app/globals.css, list it here and set THEME. Light/dark stays user-controlled. */
export const THEMES = ["deep-lab"] as const;
export type ThemeId = (typeof THEMES)[number];

export const THEME: ThemeId = "deep-lab";
