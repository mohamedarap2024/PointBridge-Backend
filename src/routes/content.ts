import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { contactMessages, siteImages, testimonials } from "../db/schema";

export const contentRoutes = new Hono();

contentRoutes.get("/images", async (c) => {
  const rows = await db.select().from(siteImages).orderBy(siteImages.category, siteImages.label);
  const map = Object.fromEntries(rows.map((row) => [row.key, row.url]));
  return c.json({ items: rows, map });
});

contentRoutes.get("/testimonials", async (c) => {
  const rows = await db
    .select()
    .from(testimonials)
    .where(eq(testimonials.approved, true))
    .orderBy(desc(testimonials.createdAt));

  return c.json({ items: rows });
});

const feedbackSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
  quote: z.string().trim().min(10).max(1000),
});

contentRoutes.post("/feedback", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = feedbackSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);
  }

  const [item] = await db
    .insert(testimonials)
    .values({ ...parsed.data, approved: false })
    .returning();

  return c.json({
    ok: true,
    message: "Thank you! Your feedback has been submitted for review.",
    item,
  });
});
