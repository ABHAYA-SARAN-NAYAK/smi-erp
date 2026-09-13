# AGENTS.md — Standing Rules for SMI ERP Build
### Every agent working in this project must read this file before doing anything else.

---

## 1. Source of Truth
- The full specification is in **`PRD_PRODUCTION.md`** in this project root. Read it fully before starting any task, and re-read the relevant section before starting each new module.
- If anything in a prompt conflicts with `PRD_PRODUCTION.md`, the PRD wins unless the user explicitly says otherwise in that prompt.

## 2. Build Order — Do Not Skip Ahead
- Follow the phases in **PRD §11 (Build Order)** strictly, one phase at a time.
- After finishing a phase, **stop and summarize what was built** (files created/changed, how to verify it) instead of automatically continuing to the next phase.
- Never jump to a later phase (e.g. building Invoice History) before the phase it depends on (Data Layer, shared components) is complete and working.

## 3. Data Layer Rule — Absolute, No Exceptions
- All data access goes through the `DataLayer` interface defined in **PRD §7**. No component, page, or form may import or call a data source directly.
- Only `mockAdapter.ts` may be implemented right now, using the demo/fake data in **PRD §8**.
- **Never build or wire up `sheetsAdapter.ts` against a real Google Sheet.** It stays an empty/stub file until the user explicitly provides real Sheet IDs and says to proceed with Phase 2 (PRD §14).
- Never introduce, invent, or hardcode real client data (real company names, real GST numbers, real amounts) anywhere in the codebase. Only the demo data already given in `PRD_PRODUCTION.md §8` is allowed.

## 4. Design System — Do Not Deviate
- Use exactly the color tokens, fonts (Fraunces for document/heading text, Inter for UI text), and component patterns defined in **PRD §5**.
- Do not substitute a different color palette, a generic admin-template look, or different fonts "for simplicity." If a library's default styling conflicts with the tokens, override it — don't drop the token.
- One primary amber action per screen. No competing primary buttons.
- Every list/table view must implement all three states: `EmptyState`, `LoadingSkeleton`, `ErrorState` — not just the happy path with data.

## 5. Security — Non-Negotiable (PRD §9)
- Passwords are never stored or compared in plaintext — hash with bcrypt or argon2, even for the demo admin account.
- Session tokens live in **httpOnly, Secure, SameSite=Strict cookies** — never in `localStorage` or `sessionStorage`.
- Validate every input **server-side** with Zod, even if it's also validated client-side.
- Never expose stack traces, raw error messages, or secrets to the browser/console in code you write.
- No API keys, Sheet IDs, or credentials hardcoded in source — always via environment variables, and `.env*` files must be in `.gitignore`.
- All destructive actions (cancel invoice, delete entry) require an explicit confirmation dialog — never a native `confirm()`/`alert()`.

## 6. Code Standards
- TypeScript everywhere, strict mode on. No `any` unless truly unavoidable, and comment why when used.
- Match the folder structure given in **PRD §2** exactly — don't invent a different structure.
- Every new list page reuses the shared components (`DataTable`, `StatCard`, `StatusPill`, `Autocomplete`, `SidePanel`, `FilterBar`, `Toast`) built in Phase 1 rather than writing one-off versions per page.
- Business logic (calculations, cascade updates) lives in the data layer / lib functions, not scattered inside React components.
- Write code so that swapping `mockAdapter.ts` for `sheetsAdapter.ts` later requires zero changes outside `/lib/data-layer`.

## 7. Testing Expectations
- Before declaring a phase "done," self-check it against the relevant items in **PRD §12 (Testing & QA Checklist)** and report which checklist items were verified.
- Flag anything that couldn't be verified rather than silently marking it complete.

## 8. Communication Rules
- After each phase: list what was built, what decisions were made (especially anywhere the PRD was ambiguous and you had to choose), and any open questions for the user.
- If a requirement in the PRD is unclear or seems to conflict with something else in it, ask rather than guessing silently and moving on.
- Do not remove or "clean up" any section of `PRD_PRODUCTION.md` or this file.

## 9. Explicit Do-Not List
- Do NOT connect to any real Google Sheet or external API not specified in the PRD.
- Do NOT use real client business data anywhere.
- Do NOT implement IGST logic (CGST+SGST only, per PRD §13 — Out of Scope).
- Do NOT add multi-user roles/permissions beyond the single admin account.
- Do NOT skip the security requirements in §5 "for now, to move faster" — they are part of the Phase 1 build, not a later add-on.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
