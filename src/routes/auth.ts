import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import {
  createToken,
  findUserByEmail,
  hashPassword,
  toAuthUser,
  verifyPassword,
  type AppVariables,
} from "../lib/auth";

const signupSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(128),
  organization: z.string().trim().max(120).optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const authRoutes = new Hono<{ Variables: AppVariables }>();

authRoutes.post("/signup", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, 400);
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await findUserByEmail(email);
  if (existing) {
    return c.json({ error: "An account with this email already exists" }, 409);
  }

  const [user] = await db
    .insert(users)
    .values({
      name: parsed.data.name,
      email,
      passwordHash: await hashPassword(parsed.data.password),
      role: "user",
    })
    .returning();

  const authUser = toAuthUser(user);
  const token = await createToken(authUser);

  return c.json({ ok: true, token, user: authUser });
});

authRoutes.post("/login", async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid credentials" }, 400);
  }

  const user = await findUserByEmail(parsed.data.email);
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const authUser = toAuthUser(user);
  const token = await createToken(authUser);

  return c.json({ ok: true, token, user: authUser });
});

authRoutes.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Not authenticated" }, 401);
  return c.json({ user });
});
