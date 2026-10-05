# AGENTS.md

This repo is the `stack` toolchain itself (`@adbayb/stack` CLI + `@adbayb/create` initializer) and it dogfoods `stack` commands. All workflow scripts delegate to the local `stack` binary.

## Bootstrap

Follow this order:

- Requires Node `^24` and pnpm `^11` (`devEngines` in root `package.json`).
- `stack/bin/index.js` imports from `stack/dist/`, so build before using the CLI:
  `pnpm --filter stack build && stack install` (this is what root `pnpm install` script does — run `pnpm install --frozen-lockfile` first for deps).
- `stack install` writes `.git/hooks/pre-commit` (`stack fix <changed-files> && git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run it if hooks are missing.

## Commands

Root scripts (`package.json`) are thin wrappers around `stack`, which wraps turbo / oxlint / oxfmt / commitlint / changesets / quickbundle. Always use these, not raw tools:

- `pnpm build` (`stack build` → `turbo run build`, cached, outputs `dist/**`, builder is `quickbundle build`)
- `pnpm check` (`stack check`: builds first excluding examples, then dependency + formatting + code + commit checks; always builds first unless `--filter commit`)
- `pnpm fix` (`stack fix`: auto-fixable oxlint `--fix-dangerously` + oxfmt `--write`)
- `pnpm test` (`stack test` → `turbo run test`, `dependsOn: build`, so build runs first)
- `pnpm clean` (`stack clean`: deletes `git clean -fdXn` output, preserves `node_modules`, plus `node_modules/.cache`)
    - Untracked-but-ignored files are removed too; don't hand-delete `dist/`, use `stack clean`.
- Release via changesets: `pnpm release:changelog` (`--changelog`), `release:version` (`--bump`), `release:snapshot` (`--snapshot`), `release:publish` (`--publish`)

Focused verification: `stack check --filter <code|formatting|dependency|commit> [files...]` and `stack fix [files...]`. CI order (`.github/workflows/workflow.yml`) is `install --frozen-lockfile` → `build` → `check` → `test`.

### Testing

- Run `pnpm check` and `pnpm test` before finishing; fix failures until green.
- Add or update tests for the code you change, even if nobody asked.

## Structure

Inner style: flat-modular CLI glue — one folder per command, shared exec in helpers; no ports ceremony (YAGNI).

- `stack/src/commands/`: one file per CLI command (`build|check|clean|create|fix|install|release|start|test|watch`); shared exec/logging in `stack/src/helpers.ts` (`turbo()`, `oxlint()`, `oxfmt()`, `changeset()`).
- `stack/configs/{oxlint,oxfmt,typescript}/`: shared presets published as `@adbayb/stack/<name>`; root `oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json` just re-export them.
- `stack/templates/{single-project,multi-projects}/`: scaffolding templates with `{{projectName}}` placeholders. Excluded from lint via `ignorePatterns: ["**/templates/**"]` — do not "fix" template placeholders.
- `stack/create/`: `@adbayb/create` (`npm init @adbayb`) thin wrapper depending on `workspace:^` `@adbayb/stack`.
- pnpm workspace members: only `stack` and `stack/create`; `saveExact: true` — pins new devDependencies exact.

## Code style guidelines

Formatting is enforced by the shared presets under `stack/configs/` (re-exported by root `oxlint.config.ts`/`oxfmt.config.ts`) — comply via `stack fix`, never hand-format.
For new code, use the `software-design` skill when available (install via `npx skills add adbayb/stack --skill software-design -g` if missing); otherwise follow these defaults. On conflict the skill wins; this list stays compressed by design:

- Minimal API surface (YAGNI — You Aren't Gonna Need It): expose only what requirements need now; small explicit functions, narrow interfaces.
- One purpose per unit (SRP — Single Responsibility Principle); composition over inheritance.
- KISS (Keep It Simple, Stupid) over cleverness; DRY (Don't Repeat Yourself) at knowledge level (rule of three before abstracting).
- High cohesion, low coupling: things that change together live together; slices talk through narrow contracts.
- POLA (Principle of Least Astonishment): names and behavior as expected; fail fast at boundaries, no surprise side effects.
- Testable: pure domain logic separated from I/O, dependencies injected.
- Avoid comments: prefer self-explanatory code; comment only the why — complex logic, non-obvious workflows, or deliberately preserved ambiguous patterns. No narration of readable code, no commented-out code.
- Skip explicit return/output types when TypeScript can infer them; annotate only when a stricter type than inferred is wanted (e.g. an enum instead of `string`).
- Pick one verb per contract, use everywhere (POLA), never add synonym for something already named.
    - Queries: `get` (one by identity, no throw) / `getAll` (collection, with optional filters/pagination, no throw), `find`/`findAll` (search, optional/filtered — absent → `undefined`/empty), `exists`/`count`.
    - Commands: `create`/`update`/`remove` for lifecycle; intention verbs for domain behavior (`refundOrder`, not `setStatus`).
    - Banned → use: `fetch`/`retrieve`/`load`/`read` → `get`/`getAll`, `query`(verb) → `find`/`findAll`/`exists`, `list` → `findAll`, `delete`/`clear` → `remove`, `add`/`insert`/`save` → `create`/`update`, `set` → intention verb (DTOs/builders exempt), `process`/`handle`/`manage`/`do` → specific intention verb, `data`/`info`/`util` → domain noun.
    - Booleans: `is*`/`has*`/`can*`. Handlers: `on<Event>`.
    - Functions verb-first (`findAllOverdueOrders`), classes/types nouns (`OrderRefunder`), no stutter (`orders.get(id)` not `orderRepo.getOrder`).
    - Editing a file: match verbs already used in that slice, don't add a second synonym.
- When unsure about an approach, ask before proceeding on an assumption that might be wrong.

## Security considerations

- Never commit secrets (tokens, credentials) — use environment variables and keep `.env*` git-ignored.
- Pin devDependencies exact (`saveExact: true`, or `workspace:*` for local packages); prefix `dependencies`/`peerDependencies` with a caret (or `workspace:^` for local dependencies — peers stay explicit); `stack check` verifies them — review automated dependency updates (Renovate) before merging.

## PR instructions

- Title follows Conventional Commits (enforced via commitlint + `commit-msg` hook); CI must be green before merge.
- Before requesting review: `pnpm check` passes, valuable tests added, changelog entry included for non-internal changes (`pnpm release:changelog`).
