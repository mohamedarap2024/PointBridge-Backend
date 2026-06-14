import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { runMigrations, seedDatabase } from "./db/seed";
import { authMiddleware, type AppVariables } from "./lib/auth";
import { adminRoutes } from "./routes/admin";
import { authRoutes } from "./routes/auth";
import { contactRoutes } from "./routes/contact";
import { contentRoutes } from "./routes/content";
import { sitemapRoutes } from "./routes/sitemap";

const app = new Hono<{ Variables: AppVariables }>();

const frontendOrigins = (process.env.FRONTEND_URL ?? "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  "/*",
  cors({
    origin: (origin: string | undefined) => {
      if (!origin) return frontendOrigins[0];
      if (frontendOrigins.includes(origin)) return origin;
      if (process.env.NODE_ENV !== "production" && origin.startsWith("http://localhost:")) {
        return origin;
      }
      return frontendOrigins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/*", authMiddleware);

app.get("/api/health", (c) =>
  c.json({
    status: "ok",
    service: "pointbridge-backend",
    timestamp: new Date().toISOString(),
  }),
);

app.route("/api/auth", authRoutes);
app.route("/api/contact", contactRoutes);
app.route("/api/content", contentRoutes);
app.route("/api/admin", adminRoutes);
app.route("/sitemap.xml", sitemapRoutes);

const port = Number(process.env.PORT ?? 3001);

async function start() {
  await runMigrations();
  await seedDatabase();

  serve({ fetch: app.fetch, port }, () => {
    console.log(`PointBridge API running at http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
