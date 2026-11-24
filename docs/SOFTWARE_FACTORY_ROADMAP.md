# Software Factory Roadmap & Operating Guide (⁠gavdaly-website⁠)

This document outlines the architecture, checklist, and operating rules to transform ⁠gavdaly/gavdaly-website⁠ (Astro 7, SolidJS, Tailwind CSS v4, Cloudflare Pages & D1) into an automated Software Factory—capable of safely accepting structured specifications from humans or AI coding agents, validating every change through deterministic quality gates, and deploying to production without manual intervention.

1. Current Factory Inventory (Already Built)
   Your repository already has a strong foundation of static analysis and local verification tools configured in ⁠package.json⁠ and ⁠.github/workflows/⁠:
   ￼ Security & Secret Scanning: CodeQL (⁠javascript-typescript⁠) and Gitleaks (⁠gitleaks-action@v3⁠) in GitHub Actions.
   ￼ Content & Schema Contracts: Astro Content Collections with Zod validation (⁠npm run typecheck⁠), Markdown linting (⁠lint:md⁠), spellchecking (⁠lint:spell⁠), and link verification (⁠lint:links⁠).
   ￼ Code & Type Hygiene: ESLint 10 (⁠--max-warnings=0⁠), Prettier v3, dual TypeScript checks (⁠typecheck⁠ for Astro, ⁠typecheck:workers⁠ for Cloudflare Workers), and dead-code detection (⁠ts-prune⁠).
   ￼ Local Pre-Commit Gates: Husky + ⁠lint-staged⁠ running ESLint, ⁠markdownlint-cli2⁠, and ⁠cspell⁠.
   ￼ Browser & Performance Tooling (Installed Locally): Playwright (⁠test:e2e⁠, ⁠test:e2e:visual⁠), ⁠@axe-core/playwright⁠, and Lighthouse CI (⁠test:lhci⁠).
2. Implementation Checklist (To-Do)
   Work through these four phases to close the remaining gaps between local scripts, CI enforcement, agent specifications, and continuous deployment.
   Phase 1: Tighten & Complete CI Quality Gates (⁠.github/workflows/ci.yml⁠)
   ￼ [ ] Fix Workflow Metadata & Caching:
   ￼ Change ⁠Name: CI⁠ to lowercase ⁠name: CI⁠ on line 1 of ⁠.github/workflows/ci.yml⁠.
   ￼ Remove the manual ⁠actions/cache@v6⁠ step for ⁠node_modules⁠ (since ⁠actions/setup-node@v7⁠ with ⁠cache: "npm"⁠ already caches the npm store safely across Node ⁠22.x⁠ and ⁠24.x⁠ without native binary collisions).
   ￼ [ ] Enforce Dead-Code & Dependency Gates:
   ￼ Remove the duplicate ⁠Dead code (ts-prune)⁠ step that has ⁠|| true⁠ and ⁠continue-on-error: true⁠ (⁠npm run lint:all⁠ already runs ⁠npm run lint:prune⁠ with ⁠--error⁠).
   ￼ Add ⁠"lint:deps": "depcheck"⁠ to ⁠package.json⁠ and include it in ⁠lint:all⁠ so unused dependencies fail the build.
   ￼ [ ] Wire Playwright E2E, Visual & Accessibility Tests into CI:
   ￼ Add an ⁠e2e-and-audits⁠ job after ⁠build⁠ that downloads ⁠site-dist-24.x⁠, installs Chromium (⁠npx playwright install --with-deps chromium⁠), and executes ⁠npm run test:e2e⁠ (including ⁠@axe-core/playwright⁠ accessibility checks and visual regression diffs).
   ￼ Upload ⁠playwright-report/⁠ as an artifact on failure (⁠if: failure()⁠) for fast debugging.
   ￼ [ ] Wire Lighthouse CI into CI:
   ￼ Run ⁠npx lhci autorun --config=lighthouserc.json⁠ inside the ⁠e2e-and-audits⁠ job to enforce performance, SEO, and accessibility budgets on every PR.
   Phase 2: Standardize Machine-Readable Inputs (JTBD Specs)
   ￼ [ ] Upgrade Issue Templates to Structured YAML Forms:
   ￼ Replace ⁠.github/ISSUE_TEMPLATE/feature_request.md⁠ with ⁠.github/ISSUE_TEMPLATE/feature_request.yml⁠ using the Jobs to be Done (JTBD) format:
   ￼ Job Statement: ⁠When [situation], I want to [motivation], so I can [expected outcome].⁠
   ￼ Affected Architecture Layers: Checkboxes for Content/Zod, Astro/Tailwind UI, SolidJS Islands, Cloudflare Workers, and D1 Migrations.
   ￼ Measurable Acceptance Criteria: Checkboxes mapping directly to Playwright assertions, ⁠axe-core⁠, or Zod schema checks.
   ￼ Visual Regression Policy: Explicit dropdown instructing whether existing visual snapshots must remain untouched or baselines should be updated.
   ￼ Auto-apply the ⁠agent-ready⁠ label to validated feature issues.
   Phase 3: Establish the Agent Operating Contract (⁠AGENTS.md⁠)
   ￼ [ ] Create ⁠AGENTS.md⁠ at the Repository Root:
   ￼ Document exact repository conventions so AI coding agents (Copilot, Claude Code, Cursor, etc.) can work autonomously without breaking invariants:
   ￼ Schema-First Content: Reference ⁠src/content.config.ts⁠ and require Zod schema updates before adding new frontmatter fields.
   ￼ Database Migrations: Require local migration verification (⁠npm run d1:migrate⁠) for any Cloudflare D1 schema changes.
   ￼ Mandatory Pre-PR Verification Loop: Require agents to pass ⁠npm run format:check⁠, ⁠npm run qa:content⁠, ⁠npm run lint:all⁠, ⁠npm run typecheck⁠, ⁠npm run typecheck:workers⁠, and ⁠npm run test:e2e⁠ locally before opening a PR.
   ￼ Visual Snapshot Guardrail: Explicitly forbid agents from running ⁠npm run test:e2e:visual:update⁠ unless the JTBD issue explicitly authorizes intentional UI changes.
   Phase 4: Close the Loop with Automated Deployment & Maintenance
   ￼ [ ] Gate Production Deploys on Full CI Verification:
   ￼ Add a ⁠deploy⁠ job in ⁠.github/workflows/ci.yml⁠ (⁠if: github.ref == 'refs/heads/main' && github.event_name == 'push'⁠, ⁠needs: [secrets, build, e2e-and-audits]⁠).
   ￼ Run ⁠npx wrangler d1 migrations apply <db-name> --remote⁠ followed by ⁠npx wrangler pages deploy dist⁠ so only verified build artifacts reach production.
   ￼ Add a post-deploy smoke check (⁠curl⁠ / Playwright check against the live production URL).
   ￼ [ ] Automate Dependency Updates:
   ￼ Configure Renovate or Dependabot to group minor/patch updates (Astro, Tailwind, ESLint, Playwright, Wrangler) and auto-merge them when ⁠CI⁠ and ⁠CodeQL⁠ checks pass.
3. Target Factory Pipeline Flow
4. Next Immediate Step
   Start with Phase 1: update ⁠.github/workflows/ci.yml⁠ to remove the ⁠continue-on-error⁠ dead-code bypass and add the ⁠e2e-and-audits⁠ job so your existing Playwright and Lighthouse suites run automatically on every pull request.
