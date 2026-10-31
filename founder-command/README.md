# Founder Command

An AI-assisted founder workspace prototype for managing multiple companies, scoped tasks, evidence, review decisions, and human-controlled engineering handoffs.

This is the full application source export, not the earlier small portfolio scaffold. It includes the frontend and backend in one repository. It does not contain the live workspace database, uploads, credentials, Git history, or a running AI/GitHub worker.

## Stack

- React 19 + TypeScript; Next-compatible App Router through Vinext/Vite
- Tailwind CSS and reusable UI components
- Cloudflare Workers, D1 (SQLite), R2 uploads
- Durable CEO and engineering queues, leases and evidence-gated results
- MCP route and optional Web Push implementation

## Start locally

Use Node.js 24 LTS (the verification scripts use `node:sqlite`). The declared package manager is pnpm; keep `pnpm-lock.yaml`.

```sh
corepack enable
corepack pnpm install --frozen-lockfile
corepack pnpm run dev
```

If Corepack is not installed, install it separately or use an existing compatible pnpm installation. Open the loopback URL printed by the dev server (normally http://localhost:5173). The default clean-clone profile is `portable`.

Local authentication is a development-only mock: visit `/signin-with-chatgpt?return_to=/`. It is not a production login system. If the local database tables are missing, stop the server, build once, apply the local migrations below, then restart the dev server.

```sh
corepack pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_futuristic_forge.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_slow_bruce_banner.sql
corepack pnpm run dev
```

Apply each migration only once to a fresh local database. Do not use `--remote` for an interview demo. No real Cloudflare account or production database should be used for these local commands. See `STARTER-README.md` for the retained framework documentation.

## Verification scripts

Run from the repository root after installing dependencies:

```sh
node --experimental-vm-modules scripts/verify-workflows.mjs
node --experimental-vm-modules scripts/verify-ceo.mjs
node --experimental-vm-modules scripts/verify-engineering.mjs
node --experimental-vm-modules scripts/verify-push.mjs
```

These are isolated handler/queue checks using mocks and temporary in-memory databases. They are not browser acceptance, real GitHub execution, real push delivery, or production Cloudflare tests. See `VALIDATION.md` for checks actually performed on this export.

## Code map

| Area | Files |
| --- | --- |
| Dashboard and styles | `app/page.tsx`, `app/globals.css`, `components/` |
| Workspace mutations | `app/api/workspace/route.ts`, `lib/workspace.ts`, `lib/queue.ts` |
| Ask CEO workflow | `app/api/ceo/route.ts`, `lib/ceo.ts` |
| Engineering claims/results | `app/api/engineering/route.ts`, `lib/engineering.ts`, `lib/engineering-targets.ts` |
| Reference uploads | `app/api/files/route.ts`, `lib/references.ts` |
| Notifications | `app/api/notifications/route.ts`, `lib/push.ts`, `public/sw.js` |
| MCP and connector integration | `app/mcp/route.ts`, `lib/connectors.ts`, `lib/connector-context.ts` |
| Storage and migrations | `db/`, `drizzle/` |
| Runtime and build support | `build/`, `scripts/`, `vite.config.ts` |

## What is and is not implemented

The app implements queue state and handoff APIs. It does not independently spawn autonomous AI employees or run GitHub coding jobs. The original hosted workflow used a separately configured ChatGPT automation and native connectors. Those accounts, permissions and schedules are not portable source files and are not included here. AI-provider calls are not required for the local dashboard.

Hosted ChatGPT sign-in, access restrictions and connected-app credentials are supplied by the Sites platform. API routes rely on that outer private-access boundary; origin checking alone is not authentication. Do not expose this app publicly as-is or trust client-supplied identity headers. A standalone public deployment needs real authentication and server-side authorization on every protected route.

Web Push requires separately configured keys, HTTPS, user permission and a supported browser. Source presence is not evidence of delivered notifications. Browser/OS sound and Do Not Disturb remain user-controlled. No email fallback is included.

The source retains historical VaartaX/Braingame target fixtures to preserve the existing checks. These strings are not GitHub authorization. Do not connect an executor to them in a copied deployment. Configure only repositories you own and explicitly authorize before any real execution. The placeholder Site ID prevents accidental reuse of the original hosting identity.

## GitHub upload

Extract this folder and upload its contents, including `.gitignore` and `.openai/hosting.json`, to a new repository you choose. Do not upload `node_modules`, `.env*`, `.wrangler`, build output, credentials or personal recordings. No automated CI is added; run checks locally first. No merge or deployment is performed by this package.

## Interview positioning

Describe this as an **AI-assisted full-stack workflow orchestration prototype**, not an autonomous company or production-ready SaaS. Explain your own decisions and what you can debug. See `INTERVIEW.md` for a demo flow and honest resume wording.

Third-party starter and component code is included; preserve bundled license notices. No blanket license grant for third-party material is implied.
