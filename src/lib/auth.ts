import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import type { Context, Next } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export type AppVariables = {
  user?: AuthUser;
};

const jwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return new TextEncoder().encode(secret);
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: AuthUser) {
  return new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(jwtSecret());
}

export async function verifyToken(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, jwtSecret());
    if (!payload.sub || typeof payload.email !== "string") return null;

    return {
      id: String(payload.sub),
      name: String(payload.name ?? ""),
      email: payload.email,
      role: String(payload.role ?? "user"),
    };
  } catch {
    return null;
  }
}

export async function authMiddleware(c: Context<{ Variables: AppVariables }>, next: Next) {
  const header = c.req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    const user = await verifyToken(token);
    if (user) c.set("user", user);
  }

  await next();
}

export async function requireAuth(c: Context<{ Variables: AppVariables }>, next: Next) {
  if (!c.get("user")) {
    return c.json({ error: "Authentication required" }, 401);
  }
  await next();
}

export async function requireAdmin(c: Context<{ Variables: AppVariables }>, next: Next) {
  const user = c.get("user");
  if (!user) return c.json({ error: "Authentication required" }, 401);
  if (user.role !== "admin") return c.json({ error: "Admin access required" }, 403);
  await next();
}

export async function findUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return user ?? null;
}

export async function findUserById(id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return user ?? null;
}

export function toAuthUser(user: typeof users.$inferSelect): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
