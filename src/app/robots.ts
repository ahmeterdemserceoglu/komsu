import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/komsu-super-control/", "/api/"],
    },
    sitemap: "https://paylas.app/sitemap.xml",
  };
}
