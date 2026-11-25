# Gavin Daly Website

[![CI](https://github.com/gavdaly/gavdaly-website/actions/workflows/ci.yml/badge.svg)](https://github.com/gavdaly/gavdaly-website/actions/workflows/ci.yml)
[![Link Check](https://github.com/gavdaly/gavdaly-website/actions/workflows/linkcheck.yml/badge.svg)](https://github.com/gavdaly/gavdaly-website/actions/workflows/linkcheck.yml)

See the project roadmap: [docs/ROADMAP.md](docs/ROADMAP.md)

## Development Environment

You can spin up a ready-to-code workspace using the included Dev Container configuration. It installs Node 23.5.0, pnpm, npm, and Cloudflare Wrangler so the usual `npm` scripts and Pages workflows run out of the box.

1. Install the [VS Code Dev Containers extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) or use [GitHub Codespaces](https://github.com/features/codespaces).
2. Open this repository and choose **Reopen in Container**.
3. After the container builds, dependencies install automatically (`postCreateCommand`).

The container forwards port `4321` for the Astro dev server and `8787` for Wrangler previews.

## Quality Checks

- `npm run lint:all` — ESLint, Markdown, spelling, and ts-prune
- `npm run qa:content` — Markdown lint, remark link validation, and spell-check across docs/content
- `npm run test:e2e` — Playwright smoke + accessibility suites
- `npm run test:lhci` — Build the site and run Lighthouse CI with performance/accessibility budgets
- `CI: secret scanning` — Gitleaks enforces baseline + allowlist for known test credentials
- `Dependabot` — Weekly dependency bump PRs (npm + GitHub Actions) every Monday at 07:00 America/Toronto
- `docs/ci-runtime-review.md` — Quarterly checklist for CI runtime, cache hit rates, and parallelism tuning
- `docs/telemetry.md` — Configure Cloudflare Observability for sampled request/error telemetry with PII scrubbing

See `docs/content-qa.md` for the full release checklist focused on headings, links, and spelling.
