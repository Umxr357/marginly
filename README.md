# Marginly

**A place for thoughts worth keeping.**

Marginly is a responsive blog platform for exploring, reading, writing, and managing stories. Its editorial design pairs warm cream and forest green with orange, lime accents, oversized typography, and serif italics.

**Repository:** [Umxr357/marginly](https://github.com/Umxr357/marginly) · **Live website:** [marginly.onrender.com](https://marginly.onrender.com) · **Hosting:** Render.

![Marginly desktop preview](docs/desktop-preview.jpg)

## Features

- Explore six original sample stories with cover images, author, category, date, excerpt, and reading time.
- Search titles, excerpts, authors, and topics; filter categories and sort by date or popularity.
- Read full stories at shareable URLs with headings, paragraphs, and quotes.
- Create an account, sign in, and manage your own writing.
- Preview stories, save private drafts, publish, edit, unpublish, and delete with confirmation.
- Keep a personal reading list, like stories, and add comments.
- Preserve posts and interactions in a database across sessions and application restarts.
- Light/dark mode, mobile layouts, loading states, empty results, unavailable-content handling, and recoverable errors.
- Keyboard focus indicators, labelled controls, reduced-motion support, and unsaved-writing protection.
- Optional WebMCP search integration, feature-detected and connected to the same visible search controls.

## Technology

| Area                | Stack                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| Interface           | React 19, TypeScript, plain CSS, Lucide icons                         |
| Application         | Next.js 16 App Router and Node.js route handlers                      |
| Production database | PostgreSQL through `pg`, hosted on Render                             |
| Local database      | PGlite: embedded PostgreSQL stored in `.data/postgres`                |
| Validation          | Zod on server and in the writing editor                               |
| Authentication      | Salted scrypt password hashes and database-backed sessions            |
| Verification        | Node test runner, API integration tests, TypeScript, ESLint, Prettier |
| Deployment          | Render Blueprint in `render.yaml`                                     |

## Setup

Requires Node.js **22.13+ or 24.x**, npm, and Git. Render uses Node 24.14.0. The GitHub repository is public and can be cloned without authentication.

```sh
git clone https://github.com/Umxr357/marginly.git
cd marginly
npm ci
npm run db:migrate
npm run dev
```

Open **http://127.0.0.1:5173**. Choose **Sign in → Create an account** to write and save stories. Reading published content does not require an account.

No database installation, API key, or environment file is needed locally. PGlite keeps data in the ignored `.data/postgres` directory. Stop the development server before running local migrations: the embedded database is intended for a single process. Missing editorial stories are seeded when the library is first requested.

To use an existing PostgreSQL server instead, copy `.env.example` to `.env.local` and set `DATABASE_URL` to its connection string before running migrations. Keep this file private. Both the migration script and Next.js read `.env.local`.

### Commands

| Command              | Purpose                                                |
| -------------------- | ------------------------------------------------------ |
| `npm run dev`        | Development server on port 5173                        |
| `npm run build`      | Optimized production build                             |
| `npm start`          | Production server on `PORT`, or 5173 by default        |
| `npm run db:migrate` | Apply pending versioned SQL migrations                 |
| `npm run typecheck`  | Check TypeScript                                       |
| `npm run lint`       | Check application, database, scripts, and tests        |
| `npm test`           | Run eight validation, password, and origin-check tests |
| `npm run test:api`   | Exercise a running local application's API             |
| `npm run format`     | Format source and documentation                        |

The API suite refuses non-loopback URLs. It checks registration, password login, logout revocation, forged identity rejection, origin checks, input validation, private drafts, ownership, publishing, updates, bookmarks, idempotent likes, comments, and deletion. It removes its temporary story and revokes its sessions; its test account remains in the local database. Use `TEST_BASE_URL` for another localhost port.

## Deploy on Render

The repository includes a Blueprint that creates a **free Node web service** and **free PostgreSQL database** in Singapore.

1. Connect the GitHub repository to Render and choose **New → Blueprint**.
2. Select `main` and the root `render.yaml` file.
3. Review the free plans and deploy. The Blueprint supplies the database connection securely.
4. Open the web service's assigned `onrender.com` URL after its health check passes.

The build command is `npm ci && npm run build`. The start command is `npm run db:migrate && npm start`. `/api/health` checks that the database schema is accessible. Startup fails clearly if `DATABASE_URL` is missing on Render; it never silently stores production data on an ephemeral local disk.

`RENDER_EXTERNAL_URL` is supplied by Render and used for browser request-origin checks. If you add a custom domain, set `APP_ORIGIN` to its full HTTPS origin. `PORT` is supplied by the host. Never expose database credentials with a `NEXT_PUBLIC_` prefix.

**Free-plan limits:** Render free web services sleep after 15 minutes of inactivity, so the first visit may be slow. A free Render PostgreSQL database **expires after 30 days** and is deleted after the subsequent grace period unless upgraded. This free configuration suits an evaluation/demo; arrange durable paid database hosting or migrate the database before expiry for ongoing use. See [Render's free-tier documentation](https://render.com/docs/free). No paid plan is selected by this Blueprint.

## Project structure

```text
app/
  api/auth/[action]/     registration, login, logout
  api/posts/             collection and story APIs
  api/health/            deployment health check
  components/            journal shell, reader, editor, account forms
  lib/                   validation, authentication, seed content, helpers
  signin/                account entry screen
  bookmarks/             personal reading list
  manage/                author's stories
  write/                 new story editor
  edit/[id]/             existing story editor
  post/[id]/             article reader
  globals.css            shared layout and responsive styles
  editorial.css          visual theme
  auth.css               account page styling
db/
  client.mjs             PostgreSQL pool / local PGlite connection
  migrations/            versioned SQL schema
scripts/                 migration, start, and API verification scripts
tests/                   validation and authentication unit tests
public/images/           original featured illustration
docs/                    desktop and mobile previews
render.yaml              reproducible Render deployment
```

## Data source and assets

No external blog API is used. The six seed articles and their author personas are original fictional demonstration content in `app/lib/seed.ts`. New stories, accounts, sessions, comments, bookmarks, and likes are stored in PostgreSQL. Browser localStorage holds only the theme preference.

The featured image is an original AI-generated editorial illustration bundled in `public/images/`. Other photographs are served from Unsplash under the [Unsplash License](https://unsplash.com/license):

- [Concrete architecture — Declan Sun](https://unsplash.com/photos/concrete-architecture-and-sunlit-structure-7A_cAtjwu10)
- [Italian Alps — Marek Piwnicki](https://unsplash.com/photos/snow-covered-mountain-under-cloudy-sky-during-daytime-TfHposjc2YY)
- [Creative workspace — Zarak Khan](https://unsplash.com/photos/monitor-keyboard-and-mouse-on-table-fj31I5HoOIQ)

Google Fonts supplies Manrope, DM Sans, and Instrument Serif with system fallbacks. User cover images accept HTTPS URLs and load directly in the browser, with a fallback icon if unavailable; the server does not fetch arbitrary image URLs.

## Security and ownership

Passwords are hashed with random salts using scrypt. Random session tokens are kept in HTTP-only, SameSite=Lax cookies (Secure in production); only token hashes are stored in the database. Sessions expire after 30 days and are revoked on sign-out. Login and registration attempts have a shared database-backed per-email rate limit.

Public queries include published posts and only the signed-in author's own drafts. Every edit and delete checks ownership on the server. Mutations validate origin and input; SQL values are parameterized. React escapes article and comment text. Identity is established from a server-verified session, never from user-supplied identity headers.

## Challenges and solutions

**Portable hosting with persistent data.** The frontend uses standard Next.js routes and a small PostgreSQL interface. Local PGlite runs the same SQL dialect without requiring a separate database server; Render uses a connection pool and a managed database.

**Draft privacy.** Visibility is part of read queries, and mutations check ownership separately. Integration tests cover anonymous draft access and attempts to modify another author's story.

**Predictable interactions.** Composite keys and desired-state requests make likes/bookmarks idempotent. Failed saves keep writing intact, deletion is confirmed, and document navigation preserves the editor's unsaved-change warning.

**Safe migrations.** Schema changes are versioned, checked for modification with SHA-256 checksums, and applied transactionally. Add a new migration rather than editing an applied file.

**Expressive, responsive design.** A shared color system, fluid typography, custom illustration, and focused mobile layouts translate the supplied visual references into a usable journal and editor.

## Scope and verification

This is a functional small blog platform. Email verification, password reset, uploads, moderation, pagination, and real-time collaboration are outside its current scope. A public launch beyond the demo should add recovery and abuse-management workflows. New comment requests are not idempotent.

The production build, TypeScript, ESLint, eight unit tests, and the local API integration suite pass. Desktop/mobile visual checks were performed for the editorial interface; see the [mobile preview](docs/mobile-preview.jpg). The production deployment was verified on October 7, 2026: Render reports Live, the database health check passes, all six seeded stories and individual articles load, missing content returns 404, and invalid/cross-origin submissions are rejected. Browser checks confirmed live search, empty results, mobile layout without horizontal overflow, and the writing/sign-in entry flow.

No credentials, session tokens, or local database contents are committed.
