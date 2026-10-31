# Interview guide

## Suggested resume entry

**Founder Command — AI-assisted workflow orchestration prototype** | React, TypeScript, Cloudflare Workers, D1/SQLite, R2

- Built an AI-assisted multi-company workspace with task lifecycle tracking, acceptance criteria, evidence and founder review checkpoints.
- Implemented durable CEO-request and engineering handoff APIs with exclusive leases, idempotent results and repository-target validation.
- Added reference-file uploads, MCP integration and isolated workflow verification scripts; documented hosted integration and end-to-end testing limits.

Use these bullets only after running the app and understanding the relevant code. Say explicitly that implementation was AI-assisted. Do not claim independent coding, live autonomous agents, production adoption, revenue or performance metrics without evidence.

## Five-minute demo

1. Launch the local dashboard with mock identity and local storage only.
2. Create a demo company and a task with a measurable acceptance check.
3. Move the task through the allowed lifecycle and show evidence requirements.
4. Submit an Ask CEO request; explain that it waits for an external coordinator, not an embedded autonomous model.
5. Show the isolated queue checks and explain lease ownership, idempotency and target pinning.

Do not attach a live GitHub executor, use private company data or claim actual PR creation during this demo.

## Questions to prepare

- Why is one shared workspace stored as JSON with optimistic version updates? What trade-offs would normalized tables offer?
- What happens when two workers claim at once, a lease expires, or a result is retried?
- Why is a GitHub URL in a note not sufficient permission to modify a repository?
- What does an isolated mocked handler test prove, and what does it leave untested?
- Why must public hosting add authentication and authorization beyond origin checks?
- How would you add tenant isolation, rate limits, audit logging and end-to-end tests before production?

## Provenance

Exported from the original Founder Command source commit `c2144d5d93a5d67035a6bf94f9cab8323f5b3527` on 31 October 2026. The export replaces the hosting project identity and adds portfolio documentation. It is not a database export or a production deployment.
