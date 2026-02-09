# Overview

AutoSys is a web-based automation platform that lets users control and automate websites using natural language instructions. It combines a React dashboard frontend with an Express backend that orchestrates browser automation via Stagehand (a Playwright-based AI browser agent). Users can create automation runs, teach the system reusable actions, view live execution logs, and manage a knowledge base of cached actions.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (React SPA)
- **Location**: `client/src/`
- **Framework**: React with TypeScript, bundled by Vite
- **Routing**: Wouter (lightweight client-side router)
- **State/Data fetching**: TanStack React Query for server state management
- **UI Components**: shadcn/ui (new-york style) built on Radix UI primitives with Tailwind CSS
- **Styling**: Tailwind CSS with dark mode as default theme, custom CSS variables for theming, JetBrains Mono for terminal/code display, Inter for body text
- **Animations**: Framer Motion for page transitions and log entry animations
- **Charts**: Recharts for dashboard analytics visualization
- **Forms**: React Hook Form with Zod validation via @hookform/resolvers
- **Key Pages**:
  - `/` - Dashboard with stats, charts, and recent runs
  - `/runs/new` - Create new automation run with URL + natural language instruction
  - `/runs/:id` - Run details with live terminal-style log viewer (polls every 2s while running)
  - `/actions` - Knowledge base of cached/learned actions
  - `/teach` - Teach mode to manually define reusable actions
- **Path aliases**: `@/` maps to `client/src/`, `@shared/` maps to `shared/`

### Backend (Express + Node.js)
- **Location**: `server/`
- **Framework**: Express.js on Node.js with TypeScript (run via tsx)
- **Entry point**: `server/index.ts` creates HTTP server, registers routes, serves static files or Vite dev middleware
- **API routes**: Defined in `server/routes.ts`, following the contract in `shared/routes.ts`
- **Development**: Vite dev server runs as middleware for HMR (`server/vite.ts`)
- **Production**: Client is built to `dist/public/`, server is bundled via esbuild to `dist/index.cjs`
- **Build script**: `script/build.ts` handles both Vite client build and esbuild server bundle

### API Structure
All API endpoints are defined as a typed contract in `shared/routes.ts` with Zod schemas:
- `GET /api/runs` - List all automation runs (most recent first, limit 50)
- `GET /api/runs/:id` - Get a specific run with logs
- `POST /api/runs` - Create and start a new automation run (fires background automation)
- `GET /api/actions` - List cached actions (optionally filtered by website)
- `DELETE /api/actions/:id` - Delete a cached action
- `DELETE /api/actions` - Clear all cached actions (optionally by website)
- `POST /api/actions` - Teach/create a new cached action

### Database (PostgreSQL + Drizzle ORM)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: `node-postgres` Pool via `DATABASE_URL` environment variable
- **Schema location**: `shared/schema.ts`
- **Tables**:
  - `automation_runs` - Tracks execution history (id, status, url, instruction, logs as JSONB string array, result as JSONB, timestamps, cost in cents)
  - `cached_actions` - Stores learned/cached browser actions (id, name, instruction, action as JSONB, website, type, schema, timestamp)
- **Migrations**: Generated to `./migrations/` directory via `drizzle-kit push` (`npm run db:push`)
- **Storage layer**: `server/storage.ts` provides a `DatabaseStorage` class implementing `IStorage` interface, abstracting all DB operations

### Automation Engine
- **Location**: `server/automation/system.ts`
- **Core library**: Stagehand (`@browserbasehq/stagehand`) - AI-powered browser automation built on Playwright
- **AI Provider**: Anthropic Claude SDK for natural language understanding and action planning
- **Execution model**: Automation runs are fired asynchronously (fire-and-forget from the HTTP handler). Logs are appended to the database in real-time, and the frontend polls for updates.
- **Browser environment**: Supports LOCAL (headless Chromium) or BROWSERBASE (cloud browser service) depending on available API keys
- **Caching**: Actions are cached in the database so the system can reuse learned interactions, reducing AI costs and improving speed
- **Key features**: Natural language prompts, incremental learning (teach chunk by chunk), workflow execution combining multiple taught actions

### Shared Code
- **Location**: `shared/`
- **Purpose**: Code shared between frontend and backend - database schema types, API route definitions, Zod validation schemas
- **`shared/schema.ts`**: Drizzle table definitions and Zod insert schemas
- **`shared/routes.ts`**: Typed API contract with paths, methods, input/output schemas, and a `buildUrl` helper

## External Dependencies

### Required Services
- **PostgreSQL Database**: Required. Connected via `DATABASE_URL` environment variable. Used for storing automation runs and cached actions.

### AI/Automation Services
- **Anthropic API**: Used for AI-powered action planning and natural language processing. Requires `ANTHROPIC_API_KEY` environment variable.
- **Stagehand / Browserbase** (optional): Cloud browser service for production automation. Uses `BROWSERBASE_API_KEY` and `BROWSERBASE_PROJECT_ID`. Falls back to local headless browser if not configured.

### Key NPM Packages
- **Frontend**: React, Wouter, TanStack React Query, shadcn/ui (Radix UI primitives), Tailwind CSS, Framer Motion, Recharts, React Hook Form, Zod, date-fns, lucide-react
- **Backend**: Express, Drizzle ORM, node-postgres (pg), Stagehand, Anthropic SDK, Zod, connect-pg-simple
- **Build tools**: Vite, esbuild, tsx, TypeScript