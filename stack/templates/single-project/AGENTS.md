# AGENTS.md

This repo is `{{projectName}}` — {{projectDescription}}.
Scaffolded with `@adbayb/stack`. All workflow scripts delegate to the `stack` binary.

> Extend `Structure` and `Conventions` as packages are added and project-specific rules emerge.

## Project

- `{{projectName}}` — {{projectDescription}}.
- Repository: `{{projectUrl}}` (`{{repoId}}`).
- Public package: `{{projectName}}` (`./{{projectName}}/src/index.ts` is the entry point, built to `dist/**` with `quickbundle`).
- Playground: `examples/*` (private, excluded from `build`/`check` orchestration).

## Bootstrap

Follow this order:

- Requires Node `{{nodeVersion}}` and pnpm `{{pnpmVersion}}` (`devEngines` in root `package.json`).
- After `stack create`: `pnpm install --frozen-lockfile`, then `stack install`.
- `stack install` writes `.git/hooks/pre-commit` (`stack fix <changed-files> && git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run it if hooks are missing.

## Commands

Root scripts (`package.json`) are thin wrappers around `stack`, which wraps turbo / oxlint / oxfmt / commitlint / changesets / quickbundle. Always use these, not raw tools:

- `pnpm build` (`stack build` → `turbo run build`, cached, outputs `dist/**`, builder is `quickbundle build`)
- `pnpm check` (`stack check`: builds first excluding examples, then dependency + formatting + code + commit checks)
- `pnpm fix` (`stack fix`: auto-fixable oxlint `--fix-dangerously` + oxfmt `--write`)
- `pnpm test` (`stack test` → `turbo run test`, `dependsOn: build`, so build runs first)
- `pnpm clean` (`stack clean`: deletes `git clean -fdXn` output, preserves `node_modules`, plus `node_modules/.cache`)
- Release via changesets: `pnpm release:changelog` (`--changelog`), `release:version` (`--bump`), `release:snapshot` (`--snapshot`), `release:publish` (`--publish`)

Focused verification: `stack check --filter <code|formatting|dependency|commit> [files...]` and `stack fix [files...]`. CI order (`.github/workflows/workflow.yml`) is `install --frozen-lockfile` → `build` → `check` → `test`.

## Structure

- `{{projectName}}/`: the publishable package (`src/index.ts` entry, `src/*.test.ts` colocated tests via `vitest`, `package.json` `exports` point to `dist/**`).
- `examples/*/`: private playground apps consuming `{{projectName}}` via `workspace:` (excluded from build/check orchestration).
- `tools/*/`: private local tooling packages.
- Root configs (`oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json`, `turbo.json`) just re-export `@adbayb/stack` shared presets — extend, don't replace.
- pnpm workspace members: `{{projectName}}`, `examples/*`, `tools/*` (`pnpm-workspace.yaml`, `saveExact: true`).

## Code style

Formatting is enforced by the shared `@adbayb/stack` presets (re-exported by root `oxlint.config.ts`/`oxfmt.config.ts`) — comply via `stack fix`, never hand-format.
For new code, use the `software-design` skill when available (install via `npx skills add adbayb/stack --skill software-design -g` if missing); otherwise follow these defaults:

- Minimal API surface (YAGNI — You Aren't Gonna Need It): expose only what requirements need now; small explicit functions, narrow interfaces.
- One purpose per unit (SRP — Single Responsibility Principle); composition over inheritance.
- KISS (Keep It Simple, Stupid) over cleverness; DRY (Don't Repeat Yourself) at knowledge level (rule of three before abstracting).
- High cohesion, low coupling: things that change together live together; slices talk through narrow contracts.
- POLA (Principle of Least Astonishment): names and behavior as expected; fail fast at boundaries, no surprise side effects.
- Testable: pure domain logic separated from I/O, dependencies injected.
- Avoid comments: prefer self-explanatory code; comment only the why — complex logic, non-obvious workflows, or deliberately preserved ambiguous patterns. No narration of readable code, no commented-out code.

## Conventions / gotchas

- No direct `oxlint`/`oxfmt`/`turbo`/`tsc` calls — go through `stack check|fix|test` so shared presets and turbo orchestration apply.
- Conventional Commits enforced (commitlint + `commit-msg` hook); `stack check` without `--filter commit` also triggers a build.
- `stack clean` is git-aware: untracked-but-ignored files are removed, `node_modules` is kept. Don't hand-delete `dist/` per package; use it.
- `saveExact: true` — pin versions, no `^` in new deps (except `workspace:` ranges).
- Never commit secrets (tokens, credentials) — use environment variables and keep `.env*` git-ignored.
