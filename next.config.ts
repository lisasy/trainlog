import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /*
   * `next build` and `next dev` share .next by default, so a production build
   * run while the dev server is up corrupts it and the dev server starts
   * throwing MODULE_NOT_FOUND. `npm run build:check` sets this to a scratch
   * directory so builds can be verified without restarting dev.
   */
  distDir: process.env.NEXT_DIST_DIR ?? ".next",

  // The dev badge sits over the sidebar's bottom-left corner, which is where
  // the status line lives. Nothing here needs it.
  devIndicators: false,
};

export default nextConfig;
