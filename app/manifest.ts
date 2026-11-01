import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "SplitSide",
    short_name: "SplitSide",
    description: "At-home split-face skincare trials. Your face is the control group.",
    start_url: "/trials",
    display: "standalone",
    orientation: "portrait",
    background_color: "#dde9da",
    theme_color: "#dde9da",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
