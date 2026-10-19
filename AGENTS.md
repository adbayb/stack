# AGENTS.md

This repo is the `stack` toolchain itself (`@adbayb/stack` CLI + `@adbayb/create` initializer) and it dogfoods `stack` commands. All workflow scripts delegate to the local `stack` binary.

## Bootstrap

Follow this order:

- Check `devEngines` in root `package.json` (`runtime.node` and `packageManager.pnpm`) and confirm the local Node and pnpm versions match it before running anything.
- Install dependencies with `pnpm install --frozen-lockfile`; its lifecycle `install` script runs `pnpm --filter stack build && stack install`. To bootstrap manually, run those two commands yourself.
- `stack install` writes `.git/hooks/pre-commit` (`stack fix <staged-files> && git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run it if hooks are missing.

## Commands

Root scripts (`package.json`) are thin wrappers around `stack`, which wraps turbo / oxlint / oxfmt / commitlint / changesets / quickbundle. Always use these, not raw tools:

- `pnpm build` (`stack build` → `turbo run build`, cached, outputs `dist/**`, builder is `quickbundle build`).
- `pnpm check` (`stack check`: builds first excluding examples, then dependency + formatting + code checks (commit checked separately via `--filter commit` or the `commit-msg` hook); always builds first unless `--filter commit`).
- `pnpm fix` (`stack fix`: auto-fixable oxlint `--fix-dangerously` + oxfmt `--write`).
- `pnpm test` (`stack test` → `turbo run test`, `dependsOn: build`, so build runs first).
- `pnpm clean` (`stack clean`: deletes git-ignored files such as build output and caches, including `node_modules/.cache`; preserves `node_modules` and `.env*`).
    - Other untracked-but-ignored files are removed too; don't hand-delete `dist/`, use `stack clean`.
- Release via changesets: `pnpm release:changelog` (`--changelog`), `release:version` (`--bump`), `release:snapshot` (`--snapshot`), `release:publish` (`--publish`).

Focused verification: `stack check --filter <code|formatting|dependency|commit> [files...]` and `stack fix [files...]`; for focused tests, `pnpm --filter @adbayb/stack test` re-runs only that workspace's suite while iterating. CI order (`.github/workflows/workflow.yml`) is `install --frozen-lockfile` → `build` → `check` → `test`.

### Testing

- Run `pnpm check` and `pnpm test` before finishing; fix failures until green.
- Add or update tests for the code you change, even if nobody asked, provided each test earns its place (covers behavior, not coverage).

## Structure

Inner style: flat-modular CLI glue: one folder per command, shared exec in helpers; no ports ceremony (YAGNI).

- `stack/src/commands/`: one module per CLI command (`build|check|clean|create|fix|install|release|start|test|watch`; flat file or folder, `check/` and `fix/` split their focused variants); shared exec/logging in `stack/src/helpers.ts` (`turbo()`, `oxlint()`, `oxfmt()`, `changeset()`).
- `stack/configs/{oxlint,oxfmt,typescript}/`: shared presets published as `@adbayb/stack/<name>`; root `oxlint.config.ts` and `oxfmt.config.ts` re-export them, and root `tsconfig.json` extends the TypeScript preset.
- `stack/templates/{single-project,multi-projects}/`: scaffolding templates with `{{projectName}}` placeholders. Excluded from lint via `ignorePatterns: ["**/templates/**"]`: do not "fix" template placeholders. Root `AGENTS.md` command, testing, code style, security, and PR sections are mirrored there: update all three files together.
- `stack/create/`: `@adbayb/create` (`npm init @adbayb`) thin wrapper depending on `workspace:^` `@adbayb/stack`.
- `.agents/skills/{software-design,code-audit}/`: toolchain-only skill artifacts following the [Agent Skills specification](https://agentskills.io/specification) (frontmatter name/description/version checks and reference checks in `stack/src/skills.test.ts`; not scaffolded into templates); bump the frontmatter `version` (semver) when the skill's instructions or references change meaningfully; the skill `version` is handled independently from the published `@adbayb/stack` version.
- pnpm workspace members: only `stack` and `stack/create`; `saveExact: true`: pins new devDependencies exact.

## Code style guidelines

Formatting is enforced by the shared presets under `stack/configs/` (re-exported by root `oxlint.config.ts`/`oxfmt.config.ts`): comply via `stack fix`, never hand-format.
Design and style rules have one source: the `software-design` skill (`.agents/skills/software-design/`: SKILL.md plus references). Install it when missing (`pnpm dlx skills add adbayb/stack --skill software-design -g`); on conflict, the skill wins its defaults and this section carries only repo deltas (none today: add a repo-specific design rule here when one emerges). If the skill cannot be installed, follow existing repository conventions and ask before structural changes.

## Security considerations

- Never commit secrets (tokens, credentials): use environment variables and keep `.env*` git-ignored. Never log or print secrets; keep them out of error messages.
- Validate untrusted input (CLI args, env, files, network) once at the boundary; fail fast with actionable errors.
- Never interpolate untrusted input into shell commands: use the shared exec helpers in `stack/src/helpers.ts`, never raw shell strings.
- Keep file writes scoped to the narrowest path set; destructive operations (`clean`) remove only git-ignored paths and generated cache directories, preserve `node_modules` and `.env*`, and refuse paths outside the working directory.
- Never run `pnpm release:publish` (or any changeset publish) manually: publishing ships versions; keep it to the documented release flow on a clean, CI-green tree.
- Pin devDependencies exact (`saveExact: true`, or `workspace:*` for local packages); prefix `dependencies`/`peerDependencies` with a caret (or `workspace:^` for local dependencies: peers stay explicit); `stack check` verifies them: review automated dependency updates (Renovate) before merging.

## PR instructions

- Title follows Conventional Commits (enforced via commitlint + `commit-msg` hook); CI must be green before merge.
- Before requesting review: `pnpm check` passes, valuable tests added, changelog entry included for non-internal changes (`pnpm release:changelog`).
