import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  org: varchar("org", { length: 120 }),
  subject: varchar("subject", { length: 150 }).notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const testimonials = pgTable("testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 160 }).notNull(),
  quote: text("quote").notNull(),
  image: text("image"),
  approved: boolean("approved").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteImages = pgTable("site_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  label: varchar("label", { length: 200 }).notNull(),
  url: text("url").notNull(),
  category: varchar("category", { length: 40 }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMembers = pgTable("team_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  role: varchar("role", { length: 160 }).notNull(),
  bio: text("bio").notNull(),
  image: text("image").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const clientLogos = pgTable("client_logos", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 120 }).notNull(),
  logo: text("logo"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type Testimonial = typeof testimonials.$inferSelect;
export type SiteImage = typeof siteImages.$inferSelect;
export type TeamMember = typeof teamMembers.$inferSelect;
export type ClientLogo = typeof clientLogos.$inferSelect;
