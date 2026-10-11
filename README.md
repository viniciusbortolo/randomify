# 🎵 Randomify

**Randomify** is a modern fullstack web application for randomizing songs, studio albums, and singles/EPs from selected artists using the Spotify Web API.

---

## 🛠️ Tech Stack

- **Monorepo:** `pnpm workspaces`
- **Frontend (`apps/web`):**
  - [Next.js](https://nextjs.org/) (App Router)
  - [Tailwind CSS](https://tailwindcss.com/)
  - [shadcn/ui](https://ui.shadcn.com/) (design system)
  - [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
  - [TanStack Query v5](https://tanstack.com/query)
  - [Lucide Icons](https://lucide.dev/)
- **Backend (`apps/api`):**
  - [Fastify](https://fastify.dev/)
  - [Prisma ORM](https://www.prisma.io/) (PostgreSQL)
  - [Zod](https://zod.dev/) + `fastify-type-provider-zod`
  - `@fastify/jwt` & `@fastify/cookie`
  - Spotify Web API (OAuth 2.0 Authorization Code Flow)
- **Shared (`packages/shared`):**
  - End-to-end type safety with shared Zod schemas and TypeScript definitions.

---

## 📁 Project Structure

```
randomify/
├── apps/
│   ├── api/             # Fastify server, Prisma & Spotify OAuth
│   └── web/             # Next.js frontend with Tailwind & TanStack Query
├── packages/
│   └── shared/          # Shared Zod schemas and TypeScript types
├── docker-compose.yml   # PostgreSQL 16 Alpine container
├── pnpm-workspace.yaml  # pnpm monorepo configuration
└── README.md
```

---

## ⚡ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v20+ or v24+
- [pnpm](https://pnpm.io/) v11+
- [Docker](https://www.docker.com/) & Docker Compose

---

### 2. Spotify Developer Dashboard Setup

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard) and log in.
2. Click **Create app**:
   - **App name:** `Randomify`
   - **App description:** `Spotify music randomizer`
   - **Redirect URI:** Add exactly:
     ```
     http://127.0.0.1:3333/auth/callback
     ```
     *(Note: Spotify's security policy requires `127.0.0.1` loopback instead of `localhost` for plain HTTP).*
   - Under **Which API/SDKs are you planning to use?**, select **Web API**.
   - Accept the terms and click **Save**.
3. In your app's **Settings**:
   - Copy the **Client ID**.
   - Click **View client secret** and copy the **Client Secret**.

---

### 3. Configure Environment Variables

Edit `apps/api/.env` and paste your Spotify credentials:

```env
PORT=3333
CLIENT_URL=http://localhost:3000
DATABASE_URL="postgresql://randomify:randomify_password@localhost:5432/randomify?schema=public"
JWT_SECRET="randomify_super_secret_jwt_key_1234567890_change_in_prod"

# Your Spotify credentials:
SPOTIFY_CLIENT_ID="YOUR_CLIENT_ID"
SPOTIFY_CLIENT_SECRET="YOUR_CLIENT_SECRET"
SPOTIFY_REDIRECT_URI="http://127.0.0.1:3333/auth/callback"
```

---

### 4. Start the Database and Run Migrations

Start the local PostgreSQL container via Docker Compose:

```bash
pnpm db:up
```

Run Prisma migrations to create the database schema:

```bash
pnpm db:migrate
```

*(Optional) Inspect the database using Prisma Studio:*
```bash
pnpm db:studio
```

---

### 5. Start Development Servers

Start both the backend and frontend concurrently:

```bash
pnpm dev
```

- **Frontend:** [http://localhost:3000](http://localhost:3000)
- **Backend API:** [http://localhost:3333](http://localhost:3333)
- **Health Check:** [http://localhost:3333/health](http://localhost:3333/health)

---

## 🎯 Features

1. **Spotify OAuth Login:**
   - Official OAuth 2.0 flow with automatic token refresh for followed artists and profile access.
2. **Artist Selection:**
   - Browse followed Spotify artists with 1-click multi-selection.
   - Real-time catalog search across Spotify.
   - Removable selection chips and counters.
3. **Smart Randomizer:**
   - **Track:** Draws random songs from albums, singles, or top tracks.
   - **Album:** Draws full studio albums across the artist's discography.
   - **Single / EP:** Draws compact releases and singles.
4. **Embedded Player:**
   - Interactive official Spotify Embed iframe with playback preview and direct app link.
5. **Artist Presets:**
   - Save custom artist groups (e.g., "Classic Rock", "Lo-Fi Beats") to PostgreSQL.
6. **Draw History:**
   - Automatically tracks past draws with timestamp and direct playback links.
