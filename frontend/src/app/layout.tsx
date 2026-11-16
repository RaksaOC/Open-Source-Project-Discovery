import type { Metadata, Viewport } from "next";
import { THEME } from "@/theme/config";
import { fontVariables } from "@/theme/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "Open Source Project Discovery Engine",
  description: "Find GitHub repositories by what you want to build: a step-by-step tour of the IR pipeline.",
};

export const viewport: Viewport = {
  colorScheme: "light dark",
};

/* Applies the saved light/dark choice before paint so there is no flash. */
const themeScript = `try{var t=localStorage.getItem("ir-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-look={THEME} className={fontVariables} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
