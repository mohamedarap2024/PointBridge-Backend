import { sql } from "drizzle-orm";
import { db } from "./index";
import { siteImages, teamMembers, testimonials, users, clientLogos } from "./schema";
import { hashPassword } from "../lib/auth";
import { count, eq } from "drizzle-orm";

const defaultImages = [
  { key: "hero.slide.1", label: "Hero — Expertise Beyond Boundaries", category: "hero", url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80" },
  { key: "hero.slide.2", label: "Hero — Building Capacity", category: "hero", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80" },
  { key: "hero.slide.3", label: "Hero — Expert Training", category: "hero", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=1600&q=80" },
  { key: "hero.slide.4", label: "Hero — Complex Settings", category: "hero", url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80" },
  { key: "logo.navbar", label: "Navbar Logo", category: "logo", url: "/pointbridge-logo.png" },
  { key: "logo.footer", label: "Footer Logo", category: "logo", url: "/pointbridge-logo-footer.png" },
  { key: "quick.blog", label: "Quick Link — Blogs", category: "quick", url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80" },
  { key: "quick.training", label: "Quick Link — Training", category: "quick", url: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=800&q=80" },
  { key: "quick.publications", label: "Quick Link — Research", category: "quick", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80" },
  { key: "quick.projects", label: "Quick Link — Events", category: "quick", url: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80" },
  { key: "blog.rigor-in-fragile-contexts", label: "Blog — Why Rigor Matters", category: "blog", url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80" },
  { key: "blog.designing-m-e-that-leaders-use", label: "Blog — Designing M&E", category: "blog", url: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&q=80" },
  { key: "blog.leadership-public-sector-reform", label: "Blog — Leadership Lessons", category: "blog", url: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&q=80" },
  { key: "blog.peace-building-evidence", label: "Blog — Building Peace", category: "blog", url: "https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=800&q=80" },
  { key: "pub.governance-fragile-states", label: "Publication — Governance Reform", category: "publication", url: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80" },
  { key: "pub.livelihoods-baseline", label: "Publication — Baseline Survey", category: "publication", url: "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=800&q=80" },
  { key: "pub.peace-program-evaluation", label: "Publication — Peace Program", category: "publication", url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=800&q=80" },
  { key: "section.clients", label: "Clients Section Background", category: "section", url: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80" },
  { key: "section.cta", label: "CTA Section Background", category: "section", url: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80" },
  { key: "about.banner", label: "About Page Banner", category: "page", url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1600&q=80" },
];

const defaultTestimonials = [
  {
    name: "Dr. Amina Yusuf",
    role: "Director, Ministry of Planning",
    quote: "PointBridge delivered with discipline and integrity in one of our most complex reform programs.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
  },
  {
    name: "Mark Johansson",
    role: "Country Director, INGO",
    quote: "Their M&E framework changed how we report results to donors — clear, defensible, on time.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
  },
  {
    name: "Hodan Ahmed",
    role: "Programme Manager, UN Agency",
    quote: "Rigorous, ethical and locally grounded. Exactly what fragile contexts need.",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80",
  },
];

const defaultTeamMembers = [
  {
    name: "Keynan A. Mohamed",
    role: "Managing Partner",
    bio: "20+ years across governance, M&E and institutional reform in East Africa.",
    image: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80",
    sortOrder: 0,
  },
  {
    name: "Dr. Fatuma Hassan",
    role: "Director, Research & Analytics",
    bio: "Mixed-methods researcher specializing in fragile and humanitarian contexts.",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&q=80",
    sortOrder: 1,
  },
  {
    name: "Ahmed Warsame",
    role: "Head of Audit & Risk",
    bio: "CPA, CIA. Former Big Four assurance leader with deep NGO and public sector experience.",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80",
    sortOrder: 2,
  },
  {
    name: "Layla Ibrahim",
    role: "Director, Human Capital",
    bio: "HR systems architect for ministries, UN agencies and international NGOs.",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&q=80",
    sortOrder: 3,
  },
];

const defaultClientLogos = [
  { name: "UN Agencies", sortOrder: 0 },
  { name: "International NGOs", sortOrder: 1 },
  { name: "Bilateral Donors", sortOrder: 2 },
  { name: "Foundations", sortOrder: 3 },
  { name: "World Bank", sortOrder: 4 },
  { name: "EU Delegation", sortOrder: 5 },
  { name: "USAID", sortOrder: 6 },
  { name: "African Union", sortOrder: 7 },
];

export async function runMigrations() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL DEFAULT 'user',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) NOT NULL,
      org VARCHAR(120),
      subject VARCHAR(150) NOT NULL,
      message TEXT NOT NULL,
      status VARCHAR(20) NOT NULL DEFAULT 'new',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS testimonials (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      role VARCHAR(160) NOT NULL,
      quote TEXT NOT NULL,
      image TEXT,
      approved BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    ALTER TABLE testimonials ADD COLUMN IF NOT EXISTS image TEXT
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS site_images (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      key VARCHAR(120) NOT NULL UNIQUE,
      label VARCHAR(200) NOT NULL,
      url TEXT NOT NULL,
      category VARCHAR(40) NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS team_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      role VARCHAR(160) NOT NULL,
      bio TEXT NOT NULL,
      image TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS client_logos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(120) NOT NULL,
      logo TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function seedDatabase() {
  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  const adminName = process.env.ADMIN_NAME ?? "Admin";

  if (adminEmail && adminPassword) {
    const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    if (existing.length === 0) {
      await db.insert(users).values({
        name: adminName,
        email: adminEmail,
        passwordHash: await hashPassword(adminPassword),
        role: "admin",
      });
      console.log(`[seed] Admin user created: ${adminEmail}`);
    }
  }

  for (const image of defaultImages) {
    await db
      .insert(siteImages)
      .values(image)
      .onConflictDoNothing({ target: siteImages.key });
  }

  const [testimonialCount] = await db.select({ value: count() }).from(testimonials);
  if ((testimonialCount?.value ?? 0) === 0) {
    await db.insert(testimonials).values(defaultTestimonials);
  }

  const [teamCount] = await db.select({ value: count() }).from(teamMembers);
  if ((teamCount?.value ?? 0) === 0) {
    await db.insert(teamMembers).values(defaultTeamMembers);
  }

  const [clientCount] = await db.select({ value: count() }).from(clientLogos);
  if ((clientCount?.value ?? 0) === 0) {
    await db.insert(clientLogos).values(defaultClientLogos);
  }
}
