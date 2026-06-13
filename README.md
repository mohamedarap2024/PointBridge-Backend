# PointBridge Backend API

Hono API server for PointBridge Consulting — contact form, auth, admin, PostgreSQL (Neon).

## Tech stack

- **Hono** + Node.js
- **PostgreSQL** (Neon) via Drizzle ORM
- **JWT** authentication

## Local development

```bash
npm install
cp .env.example .env
# Edit .env with your DATABASE_URL and secrets
npm run dev
```

API runs at **http://localhost:3001**

## API routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/contact` | Contact form |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/signup` | Sign up |
| GET | `/api/content/images` | Public site images |
| GET | `/api/admin/*` | Admin (auth required) |
| GET | `/sitemap.xml` | SEO sitemap |

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `JWT_SECRET` | Yes | Long random secret for JWT |
| `FRONTEND_URL` | Yes | Vercel URL (comma-separated for multiple) |
| `ADMIN_EMAIL` | Yes | First admin email (seeded on start) |
| `ADMIN_PASSWORD` | Yes | First admin password |
| `ADMIN_NAME` | No | Admin display name |
| `SITE_URL` | No | Production site URL for sitemap |
| `PORT` | No | Default `3001` (Render sets automatically) |

---

## Step 1 — Push to GitHub (separate repo)

Create a **new empty repo** on GitHub, e.g. `pointbridge-backend`, then:

```bash
cd Backend
git init
git add .
git commit -m "Initial commit: PointBridge backend API"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pointbridge-backend.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

---

## Step 2 — Deploy on Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo `pointbridge-backend`
3. Settings:
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Add **Environment Variables** (from Render dashboard):

   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=your-long-random-secret
   FRONTEND_URL=https://your-app.vercel.app
   ADMIN_EMAIL=admin@pointbridge.so
   ADMIN_PASSWORD=YourSecurePassword
   SITE_URL=https://your-app.vercel.app
   ```

5. Click **Deploy**

Your API URL will be like: `https://pointbridge-api.onrender.com`

> **Note:** Free Render services sleep after inactivity. First request may take ~30 seconds.

Alternatively, use the included `render.yaml` blueprint when creating from Render.

---

## Production build

```bash
npm run build
npm start
```
