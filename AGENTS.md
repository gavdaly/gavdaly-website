# Repository Guidelines

## Project Structure & Module Organization

- `src/pages/` route-based pages (Astro). Example: `src/pages/posts/[slug].astro`.
- `src/components/` UI components; prefer `.astro` or `.tsx` (Solid). Example: `ProjectCard.astro`.
- `src/layouts/` shared page shells. `MarkdownLayout.astro` for content.
- `src/content/` Markdown content (`posts/`, `notes/`, `projects/`) with frontmatter.
- `src/data/` site config and data sources. Example: `config.ts`.
- `src/utils/` TypeScript utilities. Example: `formatDate.ts`.
- `public/` static assets; `dist/` build output (generated).
- `functions/` Cloudflare Pages Functions (KV/D1, webhooks, redirects).
- `migrations/` D1 schema changes.

## Build, Test, and Development Commands

- `nvm use` (Node `v23.5.0`), then `npm i`.
- `npm run dev` — start Astro dev server.
- `npm run build` — build to `dist/`.
- `npm run preview` — serve a production build.
- `npm run check` — Astro/TS diagnostics (type, Markdown, config).
- Lint/format (on demand): `npx eslint "src/**/*.{astro,ts,tsx}"` and `npx prettier --write .`.

## Coding Style & Naming Conventions

- Indentation: 2 spaces; TypeScript strict (`tsconfig.json`).
- Components: PascalCase (`Header.astro`, `sprite.tsx`). Utilities: camelCase. Routes/content slugs: kebab-case.
- Use Tailwind utility classes (see `src/styles/tailwind.css`); keep semantic HTML.
- Prettier with Astro/Tailwind plugins; ESLint via `eslint-plugin-astro`.

## Testing Guidelines

- Before opening a PR, run `npm run format:check`, `npm run qa:content`, `npm run lint:all`, `npm run typecheck`, `npm run typecheck:workers`, and `npm run test:e2e`.
- Git commits run staged-file checks, formatting, content QA, and both type checks through Husky. Jujutsu commits do not run Git hooks; run the checks explicitly. CI runs the formatting, content QA, lint, type checks, and build, but does not yet run Playwright or Lighthouse.
- Playwright covers smoke, accessibility, and visual regression tests in `tests/e2e/`. Existing visual baselines are macOS Chromium snapshots; generate and review matching Linux baselines before enforcing visual comparisons on Linux CI.
- Update `src/content.config.ts` before introducing content frontmatter fields.
- Verify D1 schema changes locally against the intended database. `npm run d1:migrate` currently contains a placeholder database name and must be configured before use.
- Do not run `npm run test:e2e:visual:update` unless the JTBD issue explicitly authorizes intentional visual changes.
- No unit test runner is configured. Use `npm run preview` to verify pages, dynamic routes, and layouts as needed.
- Pages Functions live in `functions/`; validate redirects and form handling with local preview or a staging deploy. Consider a unit test runner if you introduce complex logic.

## Commit & Pull Request Guidelines

- Version control: use Jujutsu (`jj`) for local history work; rely on commands like `jj status`, `jj log`, `jj commit`, and `jj new` rather than Git equivalents. Sync with remotes via `jj git fetch`/`jj git push`.
- GitHub CLI (`gh`) is installed and available for GitHub operations such as authentication, pull requests, issues, and repository queries.
- Jujutsu workflow tips: `jj new <name>` creates a branch-like change, `jj log -r ::@` shows your stack, `jj amend -r @` polishes the current change, and use `jj squash`/`jj rebase` to tidy stacks before a PR.
- Prefer Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. Use `wip:` only for drafts.
- Keep messages imperative and scoped (e.g., `feat: add tags page`).
- PRs should include: concise description, rationale, screenshots for UI, reproduction/verification steps, and linked issues.

## Security & Configuration

- Do not commit secrets. Use `.env` locally; production via Cloudflare bindings.
- Expected bindings: `DISCORD_WEBHOOK`, `TURNSTILE_SECRET_KEY`, KV `GAV_DALY_REFERRAL`, D1 `DB` (see `functions/` and `migrations/`).
- Content requires frontmatter; update `src/data/config.ts` if site metadata changes.
