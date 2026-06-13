import { Hono } from "hono";
import { z } from "zod";
import { db } from "../db";
import { contactMessages } from "../db/schema";

const contactSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(255),
  org: z.string().trim().max(120).optional(),
  subject: z.string().trim().min(1).max(150),
  message: z.string().trim().min(10).max(2000),
});

export const contactRoutes = new Hono();

contactRoutes.post("/", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid form data" }, 400);
  }

  const [saved] = await db.insert(contactMessages).values(parsed.data).returning();

  return c.json({
    ok: true,
    message: "Thanks — your message has been received. We will respond within two business days.",
    id: saved.id,
  });
});
