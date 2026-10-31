# Export validation — 31 October 2026

Performed against the exported source using Node.js 24.22.1 and pnpm 11.25.0.

| Executed check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile --ignore-scripts` | Passed; dependencies installed with lifecycle scripts disabled |
| `node --experimental-vm-modules scripts/verify-workflows.mjs` | Passed: workspace persistence, transitions, uploads and reference handoff |
| `node --experimental-vm-modules scripts/verify-ceo.mjs` | Passed: leases, idempotency, delegation, cancellation and FIFO behavior |
| `node --experimental-vm-modules scripts/verify-engineering.mjs` | Passed: exclusive claims, target validation and review persistence |
| `node --experimental-vm-modules scripts/verify-push.mjs` | Passed with network delivery mocked; temporary test key generated in memory only |
| `pnpm run build` | Passed: client, RSC and SSR build stages completed |
| `pnpm exec tsc --noEmit --incremental false` | Passed, no TypeScript diagnostics |
| First D1 migration using documented `--local` command | Passed against scratch-local DB; no production data accessed |

The initial `npm ci` attempt failed because this repository uses a pnpm lockfile, not a package-lock. Use pnpm as documented; that installation succeeded.

The build emitted Vinext's route-classification limitation and a proxy-environment warning. Neither prevented completion. Browser interaction, laptop/phone installation, genuine push receipt, production authentication, real GitHub execution, live LLM calls and production deployment were not tested in this export workflow. No external repository or live Site files were modified.

These checks support a demonstrable prototype, not a claim of a production security audit or end-to-end reliability.
