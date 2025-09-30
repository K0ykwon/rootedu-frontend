# Repository Guidelines

## Project Structure & Module Organization
The Next.js app lives in `app/`, which hosts route groups, server components, and API handlers. Shared presentation layers are split into `components/ui` and `components/home`, while cross-cutting logic and adapters live in `lib/`, `hooks/`, and strongly typed contracts in `types/`. Static assets reside in `public/`, operational scripts in `scripts/`, and vector database data in `chroma/`; keep new domain documentation alongside `docs/` for quick discovery.

## Build, Test, and Development Commands
- `npm run dev` — start the local dev server with Turbopack reloading.
- `npm run build` — produce an optimized Next.js production bundle.
- `npm run start` — serve the production build locally for smoke testing.
- `npm run lint` — run the ESLint + Next defaults; required before any PR.
- `npm run seed` / `npm run setup-vector-db` — populate Redis + Chroma with baseline data before demoing AI features.

## Coding Style & Naming Conventions
TypeScript is the default; prefer server components and async/await helpers for data fetching. Use PascalCase for React components and hooks in `hooks/`, camelCase for utilities, and hyphenated folder names inside `app/` to match route slugs. Stick to 2-space indentation, Tailwind utility ordering from layout → spacing → colors, and let `npm run lint` surface formatting issues.

## Testing Guidelines
Playwright is available for end-to-end coverage; add specs under `tests/e2e/` named `<feature>.spec.ts` and run them with `npx playwright test`. Lightweight smoke checks live in `scripts/test-*.ts`; execute via `npx tsx` when touching OpenAI or auth integrations. Target high-risk flows (auth, influencer/product retrieval) and capture expected Redis/Upstash fixtures in your test setup.

## Commit & Pull Request Guidelines
History favors concise, present-tense subjects (e.g. `Fixed slug page crushing issue`); follow the same style and include a short body when context is non-obvious. Reference relevant issue IDs in the body, describe breaking changes explicitly, and avoid bundling unrelated work. PRs should link to the user story, summarize changes, list manual test steps, and attach screenshots or Postman traces for UI or API updates.

## Security & Configuration Tips
Keep secrets in `.env.local`; required values include NextAuth providers, Upstash Redis URL/token, Cohere/OpenAI keys, and vector store paths. Run `npm run setup-vector-db` after changing embeddings or product metadata so notebooks and agents stay in sync. Never commit credentials or raw data exports—store sanitized fixtures in `docs/` or `public/mock-data/` instead.
c