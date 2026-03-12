import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Barron & Folly",
    short_name: "B&F",
    description:
      "Agentic product agency that replaces fragmented teams with an autonomous execution engine. Software, systems, and brand infrastructure — deployed on demand.",
    start_url: "/",
    display: "standalone",
    background_color: "#0A0A08",
    theme_color: "#FF8400",
    icons: [
      {
        src: "/images/brand/favicon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/images/brand/webclip.svg",
        sizes: "180x180",
        type: "image/svg+xml",
        purpose: "apple touch icon",
      },
    ],
  };
}
