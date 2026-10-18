import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "NOMAD BUSINESS",
    short_name: "NOMAD",
    description: "Монгол даяарх бизнесүүдийн газрын зураг ба захиалгын платформ.",
    start_url: "/",
    display: "standalone",
    background_color: "#efebe2",
    theme_color: "#efebe2",
    lang: "mn",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
