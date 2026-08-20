import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "trainlog",
    short_name: "trainlog",
    description: "Terminal-flavored training log.",
    start_url: "/",
    // Installed rather than a browser tab: this is also what exempts the log
    // from Safari's 7-day eviction of script-writable storage.
    display: "standalone",
    background_color: "#191919",
    theme_color: "#191919",
    orientation: "portrait",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
