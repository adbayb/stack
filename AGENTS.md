# AGENTS.md

This repo is the `stack` toolchain (`@adbayb/stack` CLI + `@adbayb/create` initializer); it dogfoods its own commands.

## Instruction precedence

`AGENTS.md` applies to its subtree; nearest wins on conflicts. Repo rules override skill defaults; each skill owns its internal precedence.

## Bootstrap

- Match `devEngines` in root `package.json` (Node, pnpm) before running anything.
- `pnpm install --frozen-lockfile`; its `install` lifecycle runs `pnpm --filter stack build && stack install`. Run them manually to recover.
- `stack install` writes `.git/hooks/pre-commit` (`stack fix` on staged files, then `git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run if missing.

## Commands

Root scripts are thin wrappers; use them, not raw tools.

- `pnpm build` -> `stack build`: cached turbo build to `dist/**` via quickbundle.
- `pnpm check` -> `stack check`: build + dependency/format/code checks; commit checks are separate (`--filter commit` or hook).
- `pnpm fix` -> `stack fix`: cached build, then oxlint + oxfmt autofix.
- `pnpm test` -> `stack test`: turbo tests, build first.
- `pnpm start` / `pnpm watch`: turbo start/watch runs (package-defined).
- `pnpm clean` -> `stack clean`: removes git-ignored files and `node_modules/.cache`; keeps installed dependencies/`.env*`; never hand-delete `dist/`.
- `pnpm release:changelog` adds a changeset; `release:{version,snapshot,publish}` run only in `.github/workflows/continuous_delivery.yml`.

Focused: `pnpm check --filter <code|formatting> [files...]` (files only apply to these filters), `pnpm check --filter <dependency|commit>`, `pnpm fix [files...]`, `pnpm --filter <package> test`. CI: install -> build -> check -> test.

### Testing

- Run `pnpm check` and `pnpm test` before finishing; fix regressions, report pre-existing failures.
- Test design and baseline handling: `software-design` reference `testing-refactoring.md`.

## Structure

Flat-modular CLI glue: one folder per command, shared exec in helpers, no ports ceremony (YAGNI).

- `stack/src/commands/`: one module per command (`build|check|clean|create|fix|install|release|start|test|watch`); `check/` and `fix/` split focused variants; shared exec/logging in `stack/src/helpers.ts`.
- `stack/configs/{oxlint,oxfmt,typescript}/`: shared `@adbayb/stack` presets; root configs re-export/extend them.
- `stack/templates/{single-project,multi-projects}/`: standalone scaffolds, excluded from lint. Root `AGENTS.md` owns shared instruction sections; update both copies, guarded by `stack/src/templates.test.ts`.
- `stack/create/`: `@adbayb/create` wrapper (`workspace:^`); workspace members: `stack`, `stack/create`.
- `stack/skills/` (`.agents/skills` symlinks here): published Agent Skills in `<domain>-design` (rule owner) and `<domain>-audit` (requires it) pairs, guarded by `stack/src/skills.test.ts`. Write skills and agent instructions with `skill-design` and audit them with `skill-audit`; audit code with `software-audit`, and run both audits on mixed changes. Bump `metadata.version` semver on contract changes (patch: wording; minor: added rule/reference; major: removed/renamed rule, workflow, or prerequisite).

## Code style guidelines

Use `pnpm fix` for formatting and lint autofixes; never hand-format.

Design/style defaults: the `software-design` skill (SKILL.md + references). Load the repo copy when present; otherwise ask before installing it (`pnpm dlx skills add adbayb/stack --skill software-design -g`). Add repo-specific rules here; if it cannot load, follow local conventions and ask before structural changes.

## Security considerations

- Never commit secrets; use env vars, keep `.env*` ignored, and never log/print them.
- Code-level security rules: `software-design` reference `security.md`.
- Pin devDependencies exactly (`saveExact`, `workspace:*` locally); use caret for `dependencies` and `peerDependencies` (`workspace:^` for local deps); peer ranges stay explicit. `stack check` enforces; review Renovate.

## PR instructions

- Conventional Commits for PR titles and commits (commitlint + hooks).
- Before review: required checks green; changeset for non-internal changes (`pnpm release:changelog`).
- Do not commit, push, force-push, or publish unless asked; preserve unrelated worktree edits.
