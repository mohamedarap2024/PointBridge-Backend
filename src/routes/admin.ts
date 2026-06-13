import { Hono } from "hono";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "../db";
import { contactMessages, siteImages, testimonials, users } from "../db/schema";
import {
  hashPassword,
  requireAdmin,
  type AppVariables,
} from "../lib/auth";

export const adminRoutes = new Hono<{ Variables: AppVariables }>();

adminRoutes.use("*", requireAdmin);

adminRoutes.get("/stats", async (c) => {
  const [messages, newMessages, allTestimonials, pendingTestimonials, images, allUsers] =
    await Promise.all([
      db.select().from(contactMessages),
      db.select().from(contactMessages).where(eq(contactMessages.status, "new")),
      db.select().from(testimonials),
      db.select().from(testimonials).where(eq(testimonials.approved, false)),
      db.select().from(siteImages),
      db.select().from(users),
    ]);

  return c.json({
    contacts: { total: messages.length, new: newMessages.length },
    testimonials: { total: allTestimonials.length, pending: pendingTestimonials.length },
    images: { total: images.length },
    users: { total: allUsers.length },
  });
});

adminRoutes.get("/contacts", async (c) => {
  const rows = await db.select().from(contactMessages).orderBy(desc(contactMessages.createdAt));
  return c.json({ items: rows });
});

const statusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});

adminRoutes.patch("/contacts/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = statusSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: "Invalid status" }, 400);

  const [updated] = await db
    .update(contactMessages)
    .set({ status: parsed.data.status })
    .where(eq(contactMessages.id, c.req.param("id")))
    .returning();

  if (!updated) return c.json({ error: "Message not found" }, 404);
  return c.json({ item: updated });
});

adminRoutes.delete("/contacts/:id", async (c) => {
  const [deleted] = await db
    .delete(contactMessages)
    .where(eq(contactMessages.id, c.req.param("id")))
    .returning();

  if (!deleted) return c.json({ error: "Message not found" }, 404);
  return c.json({ ok: true });
});

adminRoutes.get("/testimonials", async (c) => {
  const rows = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  return c.json({ items: rows });
});

const testimonialSchema = z.object({
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
  quote: z.string().trim().min(10).max(1000),
  approved: z.boolean().optional(),
});

adminRoutes.post("/testimonials", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = testimonialSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const [item] = await db
    .insert(testimonials)
    .values({ ...parsed.data, approved: parsed.data.approved ?? true })
    .returning();

  return c.json({ item }, 201);
});

adminRoutes.patch("/testimonials/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = testimonialSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const [item] = await db
    .update(testimonials)
    .set(parsed.data)
    .where(eq(testimonials.id, c.req.param("id")))
    .returning();

  if (!item) return c.json({ error: "Testimonial not found" }, 404);
  return c.json({ item });
});

adminRoutes.delete("/testimonials/:id", async (c) => {
  const [deleted] = await db
    .delete(testimonials)
    .where(eq(testimonials.id, c.req.param("id")))
    .returning();

  if (!deleted) return c.json({ error: "Testimonial not found" }, 404);
  return c.json({ ok: true });
});

adminRoutes.get("/images", async (c) => {
  const rows = await db.select().from(siteImages).orderBy(siteImages.category, siteImages.label);
  return c.json({ items: rows });
});

const imageUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2000)
  .refine((value) => value.startsWith("/") || value.startsWith("http"), "Enter a valid URL or path");

const imageSchema = z.object({
  key: z.string().trim().min(1).max(120),
  label: z.string().trim().min(1).max(200),
  url: imageUrlSchema,
  category: z.string().trim().min(1).max(40),
});

adminRoutes.post("/images", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = imageSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const [item] = await db.insert(siteImages).values(parsed.data).returning();
  return c.json({ item }, 201);
});

adminRoutes.patch("/images/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = imageSchema.partial().safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const [item] = await db
    .update(siteImages)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(siteImages.id, c.req.param("id")))
    .returning();

  if (!item) return c.json({ error: "Image not found" }, 404);
  return c.json({ item });
});

adminRoutes.delete("/images/:id", async (c) => {
  const [deleted] = await db
    .delete(siteImages)
    .where(eq(siteImages.id, c.req.param("id")))
    .returning();

  if (!deleted) return c.json({ error: "Image not found" }, 404);
  return c.json({ ok: true });
});

adminRoutes.get("/users", async (c) => {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return c.json({ items: rows });
});

const userUpdateSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(["admin", "user"]).optional(),
  password: z.string().min(8).max(128).optional(),
});

adminRoutes.patch("/users/:id", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const updates: Record<string, unknown> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.password) updates.passwordHash = await hashPassword(parsed.data.password);

  const [item] = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, c.req.param("id")))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  if (!item) return c.json({ error: "User not found" }, 404);
  return c.json({ item });
});

adminRoutes.delete("/users/:id", async (c) => {
  const current = c.get("user");
  if (current?.id === c.req.param("id")) {
    return c.json({ error: "You cannot delete your own account" }, 400);
  }

  const [deleted] = await db.delete(users).where(eq(users.id, c.req.param("id"))).returning({ id: users.id });
  if (!deleted) return c.json({ error: "User not found" }, 404);
  return c.json({ ok: true });
});

adminRoutes.post("/users", async (c) => {
  const schema = z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email(),
    password: z.string().min(8).max(128),
    role: z.enum(["admin", "user"]).default("user"),
  });

  const body = await c.req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);

  const email = parsed.data.email.toLowerCase();
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length) return c.json({ error: "Email already exists" }, 409);

  const [item] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: parsed.data.role,
    })
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    });

  return c.json({ item }, 201);
});
