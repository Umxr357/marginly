# Marginly

**A place for thoughts worth keeping.**

Marginly is a responsive editorial blog platform for discovering, reading, writing, and managing stories. Its interface pairs a bold editorial journal with a focused writing workspace. The visual direction follows the supplied references: warm cream, forest green, vivid orange, lime accents, generous typography, and Instrument Serif italics.

## Features

- Explore original sample articles with author, date, category, excerpt, and reading time.
- Search by title, description, author, or topic; filter categories and sort by date or likes.
- Open individual articles at shareable URLs, including graceful unavailable-content states.
- Create stories, choose a cover image, preview formatting, save private drafts, edit, publish, unpublish to draft, and delete your own posts.
- Persist posts, comments, bookmarks, and likes in Cloudflare D1.
- Personal reading list and idempotent likes, with comments on individual stories.
- ChatGPT sign-in with server-side ownership checks. Only the author can read their drafts or edit/delete their posts.
- Light/dark mode, responsive layouts, keyboard focus indicators, semantic labels, reduced-motion support, loading feedback, and recoverable errors.
- A feature-detected WebMCP search tool uses the same visible search state.

## Stack

React 19, TypeScript, Vinext (Next.js App Router-compatible routing on Vite), Cloudflare Workers, D1/SQLite, Drizzle schema migrations, Zod validation, Lucide icons, and plain CSS. Prettier formats application code. The Sites starter provides the Worker build, authentication integration, and deployment plumbing.

## Local setup

Requirements: Node.js **22.13+** (Node 24 recommended), npm, and Git. No paid external content API is required.

```sh
git clone https://github.com/Umxr357/marginly.git
cd marginly
npm ci
npm run build
npm run db:local
npm run dev
```

Open the local URL printed by the server (normally `http://127.0.0.1:5173`). Click **Sign in** to use the starter's local-only test identity. This simulation is enabled only for loopback development and is excluded from production builds.

`db:local` applies the initial schema to a fresh local database. Run it once per new local database; do not replay an already applied migration. The first library request seeds six sample stories idempotently. Local data lives in ignored `.wrangler/state`.

The repository is already configured with the logical D1 binding `DB`. Building generates the local Wrangler configuration. For later schema changes, edit `db/schema.ts`, run `npm run db:generate`, inspect the new SQL, and apply only pending migrations.

If a Windows npm shim reports missing npm modules, invoke npm through its installed `npm-cli.js` using Node; the application itself remains cross-platform.

## Commands

| Command               | Purpose                                                      |
| --------------------- | ------------------------------------------------------------ |
| `npm run dev`         | Development server with live updates                         |
| `npm run build`       | Compile the Cloudflare Worker and browser assets             |
| `npm start`           | Preview the built Worker locally (does not simulate sign-in) |
| `npm run typecheck`   | TypeScript checks                                            |
| `npm test`            | Input-validation tests                                       |
| `npm run test:api`    | Integration tests against a running local development server |
| `npm run format`      | Format application code and documentation                    |
| `npm run db:generate` | Generate a new schema migration                              |

The integration suite creates a temporary local test story and removes it in a `finally` block. It refuses remote URLs. `TEST_BASE_URL` can point to a different loopback port.

## Project structure

```text
app/
  components/           journal shell, article reader, writing editor
  lib/                  types, seed content, validation, API and database helpers
  api/posts/            collection and item APIs
  bookmarks/            saved reading list
  manage/               author-owned stories
  write/                new story editor
  edit/[id]/            existing story editor
  post/[id]/            article page
  globals.css           shared layout and responsive styles
  editorial.css         reference-inspired visual theme
db/                     Drizzle schema
drizzle/                generated migrations
tests/                  validation tests
scripts/test-api.mjs    local API integration suite
build/                  starter Worker and Sites integration
```

## Data and assets

Article text and author personas are original fictional demonstration content, stored in `app/lib/seed.ts`. No third-party blog API is used. Newly authored content is stored in D1. The only browser storage is a device-local theme preference; published records and saved interactions are not kept in localStorage.

Photographs are provided by Unsplash under the [Unsplash License](https://unsplash.com/license):

- [Concrete architecture — Declan Sun](https://unsplash.com/photos/concrete-architecture-and-sunlit-structure-7A_cAtjwu10)
- [Italian Alps — Marek Piwnicki](https://unsplash.com/photos/snow-covered-mountain-under-cloudy-sky-during-daytime-TfHposjc2YY)
- [Creative workspace — Zarak Khan](https://unsplash.com/photos/monitor-keyboard-and-mouse-on-table-fj31I5HoOIQ)

Images are remotely hosted; cards show a book icon if an image is unavailable. An original AI-generated editorial illustration accompanies the featured story and is bundled locally in `public/images/`. Google Fonts supplies Manrope, DM Sans, and Instrument Serif, with system fallbacks. User cover images accept HTTPS URLs only. The server never fetches user-supplied image URLs.

## API and ownership

`GET /api/posts` returns published posts plus the signed-in author's own drafts. `POST /api/posts` creates a story. `/api/posts/:id` supports reading, editing, deleting, and posting like/bookmark/comment actions. Mutations require an authenticated identity, validate input, and check request origin. Editing and deletion additionally enforce ownership. SQL values use prepared statements. Comments and article text render as escaped React text; headings and quotes use a deliberately small formatting syntax, not arbitrary HTML.

Production identity comes from trusted Sites dispatch headers. A standalone deployment must implement a trusted identity boundary and strip incoming user-supplied identity headers; do not expose the Worker directly and assume those headers are authenticated.

## Challenges and decisions

**Durable data rather than browser-only demos.** D1 stores real product records; a small server helper keeps queries and error handling consistent. Drizzle migrations own schema creation, and runtime sample seeding inserts missing editorial records and refreshes their cover artwork.

**Draft privacy and ownership.** Read queries include a visibility condition, and every update/delete checks the authenticated author. The integration suite verifies anonymous draft exclusion and forbidden edits to another author's story.

**Reliable interactions.** Likes and bookmarks use composite primary keys and desired-state requests, so duplicate clicks do not create duplicate reactions. Saving errors keep editor input intact. Native unload protection warns about unsaved changes, and deletion requires an explicit confirmation dialog.

**Safe, focused editing.** Plain text with paragraph, heading, and quote support keeps the editor predictable without introducing HTML injection. Both client and server validate limits and image protocols.

**Portable deployment.** The retained Sites build emits Worker-compatible output with logical D1 bindings. Local preview and production use the same schema. A Windows npm shim issue during development was handled by invoking the existing npm JavaScript entrypoint directly.

## Scope and limitations

This is a complete small-platform implementation, not a production social network. There are no uploads, password accounts, moderation tools, pagination, or real-time updates. Cover images use external HTTPS links. New comment requests are not idempotent. The initial deployment is private and requires the owner's access; sharing can be changed in Sites when ready. Private deployment access applies in addition to app-level ownership.

Source and deployment links are recorded in the submission handoff. No credentials or local database contents are committed.
