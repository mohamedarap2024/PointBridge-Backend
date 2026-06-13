import { Hono } from "hono";

import { sitePaths } from "../data/site-data";

export const sitemapRoutes = new Hono();

sitemapRoutes.get("/", (c) => {
  const baseUrl = process.env.SITE_URL ?? "";
  const urls = sitePaths
    .map(
      (path) =>
        `  <url><loc>${baseUrl}${path}</loc><changefreq>weekly</changefreq><priority>${path === "/" ? "1.0" : "0.7"}</priority></url>`,
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return c.body(xml, 200, {
    "Content-Type": "application/xml",
    "Cache-Control": "public, max-age=3600",
  });
});
