# AGENTS.md

This repo is the `stack` toolchain itself (`@adbayb/stack` CLI + `@adbayb/create` initializer) and it dogfoods `stack` commands. All workflow scripts delegate to the local `stack` binary.

## Bootstrap (order matters)

- Requires Node `^24` and pnpm `^11` (`devEngines` in root `package.json`).
- `stack/bin/index.js` imports from `stack/dist/`, so build before using the CLI:
  `pnpm --filter stack build && stack install` (this is what root `pnpm install` script does — run `pnpm install --frozen-lockfile` first for deps).
- `stack install` writes `.git/hooks/pre-commit` (`stack fix <changed-files> && git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run it if hooks are missing.

## Commands — always use these, not raw tools

Root scripts (`package.json`) are thin wrappers around `stack`, which wraps turbo / oxlint / oxfmt / commitlint / changesets / quickbundle:

- `pnpm build` (`stack build` → `turbo run build`, cached, outputs `dist/**`, builder is `quickbundle build`)
- `pnpm check` (`stack check`: builds first excluding examples, then dependency + formatting + code + commit checks)
- `pnpm fix` (`stack fix`: auto-fixable oxlint `--fix-dangerously` + oxfmt `--write`)
- `pnpm test` (`stack test` → `turbo run test`, `dependsOn: build`, so build runs first)
- `pnpm clean` (`stack clean`: deletes `git clean -fdXn` output, preserves `node_modules`, plus `node_modules/.cache`)
- Release via changesets: `pnpm release:changelog` (`--changelog`), `release:version` (`--bump`), `release:snapshot` (`--snapshot`), `release:publish` (`--publish`)

Focused verification: `stack check --filter <code|formatting|dependency|commit> [files...]` and `stack fix [files...]`. CI order (`.github/workflows/workflow.yml`) is `install --frozen-lockfile` → `build` → `check` → `test`.

## Layout

- `stack/src/commands/`: one file per CLI command (`build|check|clean|create|fix|install|release|start|test|watch`); shared exec/logging in `stack/src/helpers.ts` (`turbo()`, `oxlint()`, `oxfmt()`, `changeset()`).
- `stack/configs/{oxlint,oxfmt,typescript}/`: shared presets published as `@adbayb/stack/<name>`; root `oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json` just re-export them.
- `stack/templates/{single-project,multi-projects}/`: scaffolding templates with `{{projectName}}` placeholders. Excluded from lint via `ignorePatterns: ["**/templates/**"]` — do not "fix" template placeholders.
- `stack/create/`: `@adbayb/create` (`npm init @adbayb`) thin wrapper depending on `workspace:^` `@adbayb/stack`.
- pnpm workspace members: only `stack` and `stack/create`; `saveExact: true` — pin versions, no `^` in new deps.

## Conventions / gotchas

- No direct `oxlint`/`oxfmt`/`turbo`/`tsc` calls — go through `stack check|fix|test` so shared presets and turbo orchestration apply.
- Conventional Commits enforced (commitlint + `commit-msg` hook); `stack check` without `--filter commit` also triggers a build.
- `stack clean` is git-aware: untracked-but-ignored files are removed, `node_modules` is kept. Don't hand-delete `dist/` per package; use it.
