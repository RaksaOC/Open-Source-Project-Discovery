import type { NextConfig } from "next";

/* The browser only calls /api/*; Next proxies it to the FastAPI backend. Rewrites are baked
   in at build time, so the Docker image takes API_URL as a build arg (compose sets it). */
const API_URL = process.env.API_URL ?? "http://127.0.0.1:8100";

const config: NextConfig = {
  poweredByHeader: false,
  output: "standalone", // small self-contained server for the Docker image
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${API_URL}/api/:path*` }];
  },
};

export default config;
