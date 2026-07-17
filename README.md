# Pokemetrix

Pokemetrix is a monorepo containing a modern web application and a WebAssembly-based Pokémon damage calculator.

## 🛠️ Tech Stack

### Application (`apps/web`)
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database & Backend:** [Supabase](https://supabase.com/) (PostgreSQL) + [Drizzle ORM](https://orm.drizzle.team/)
- **State Management & Data Fetching:** [Jotai](https://jotai.org/), [React Query](https://tanstack.com/query/latest)
- **Styling & UI:** Material UI, Base UI, Emotion
- **Tooling:** Vitest (Testing), [Oxc](https://oxc-project.github.io/) (`oxlint`, `oxfmt`) for lightning-fast linting and formatting

### Packages (`packages/*`)
- **`@pokemetrix/damage-calc`:** High-performance Pokémon damage calculator written in **Rust** and compiled to **WebAssembly (Wasm)**.

### Monorepo Tooling
- **Package Manager:** [pnpm](https://pnpm.io/)
- **Build System:** [Turborepo](https://turbo.build/)
- **Versioning & Releases:** [Changesets](https://github.com/changesets/changesets)

---

## 🚀 Setup Instructions

### Prerequisites
Ensure you have the following installed on your system:
- [Node.js](https://nodejs.org/) (v24+ recommended)
- [pnpm](https://pnpm.io/) (v11+)
- [Rust & Cargo](https://rustup.rs/) (with the `wasm32-unknown-unknown` target)
- [`wasm-pack`](https://rustwasm.github.io/wasm-pack/) (Install via `cargo install wasm-pack`)
- [Supabase CLI](https://supabase.com/docs/guides/cli) (Requires Docker for local development)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Must be running for Supabase)

### Environment Variables
Before running the app, you need to configure your environment variables. 
For local development, create a `.env.local` file in the `apps/web` directory.

**Core Database & Supabase Variables:**
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase API URL (e.g., `http://127.0.0.1:54321` for local).
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase Anon/Publishable key.
- `DATABASE_URL`: Connection string for PostgreSQL, used by Drizzle ORM (e.g., `postgresql://postgres:postgres@127.0.0.1:54322/postgres` for local).

**Optional / Third-Party Services:**
- `SENTRY_AUTH_TOKEN`: Used for uploading source maps to Sentry (primarily needed in CI/CD).

### Installation & Local Development

1. **Install Dependencies:**
   ```bash
   pnpm install
   ```

2. **Start the Local Environment:**
   Run the following command from the root directory. This will start the local Supabase container, run Drizzle database migrations, and spin up the Next.js development server:
   ```bash
   pnpm run dev
   ```

3. **Access the App:**
   - Web App: [http://localhost:3000](http://localhost:3000)
   - Supabase Studio (Local): [http://localhost:54323](http://localhost:54323)

### Database Management
Database scripts are located in `apps/web` but can be run via pnpm filters or directly inside the app directory:
- `pnpm --filter @pokemetrix/app run db:generate` - Generate Drizzle migrations
- `pnpm --filter @pokemetrix/app run db:migrate` - Apply migrations to the database (defaults to local database via `.env.local`)
- `pnpm --filter @pokemetrix/app run db:studio` - Open Drizzle Studio to inspect the database visually
- `pnpm --filter @pokemetrix/app run db:reset:local` - Reset the local Supabase database and re-apply migrations

#### Production Database Migration
To apply migrations to the production database from your local machine, run the migration script with `NODE_ENV=production` so that it uses the production environment variables (`.env.production`), or pass the `DATABASE_URL` explicitly.

**Option A: Using Vercel CLI (Recommended)**
```bash
# 1. Pull production variables
vercel env pull .env.production

# 2. Run migration pointing to production
# (Windows PowerShell)
$env:NODE_ENV="production"; pnpm --filter @pokemetrix/app run db:migrate

# (macOS/Linux)
NODE_ENV=production pnpm --filter @pokemetrix/app run db:migrate
```

**Option B: Using direct DATABASE_URL**
```bash
# (Windows PowerShell)
$env:DATABASE_URL="<YOUR_PROD_URL>"; pnpm --filter @pokemetrix/app run db:migrate

# (macOS/Linux)
DATABASE_URL="<YOUR_PROD_URL>" pnpm --filter @pokemetrix/app run db:migrate
```

---

## 📦 Release Cycle

This repository uses [Changesets](https://github.com/changesets/changesets) and GitHub Actions to automate versioning, changelogs, and package publishing.

### 1. Documenting Changes
Whenever you make a change that requires a version bump (patch, minor, or major), generate a changeset:
```bash
pnpm changeset
```
Follow the CLI prompts to select which packages to bump and provide a description of your changes. This will create a markdown file in the `.changeset` directory.

### 2. Committing
Commit the generated `.changeset/*.md` file along with your code changes and push to your branch.

### 3. Automated Release Process
When changes are merged into the `main` branch, the **Changesets GitHub Action** (`.github/workflows/changesets.yml`) takes over:
- It runs `pnpm turbo run version` to consume the changeset files and bump the `package.json` versions.
- It updates the `CHANGELOG.md` files.
- It automatically publishes updated packages (like the Rust/Wasm `@pokemetrix/damage-calc`) to the npm registry.
- It creates a new Release and Tag on GitHub.
