import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gallosoft — Galería Ustariz",
    short_name: "Gallosoft",
    description: "Gestión de gallos de la Galería Ustariz",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "es",
    dir: "ltr",
    background_color: "#131313",
    theme_color: "#f2ca50",
    categories: ["productivity", "utilities"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buscar gallos", short_name: "Buscar", url: "/gallos", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Nuevo gallo", short_name: "Nuevo", url: "/gallos/nuevo", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Planilla de trabajo", short_name: "Planilla", url: "/planillas", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
