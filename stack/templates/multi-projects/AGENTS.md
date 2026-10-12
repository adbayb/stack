# AGENTS.md

This repo is `{{projectName}}`: {{projectDescription}}.
Scaffolded with `@adbayb/stack`. All workflow scripts delegate to the `stack` binary.

> Extend `Project overview`, `Code style guidelines`, and `Security considerations` as packages are added and project-specific rules emerge.

## Project overview

- `{{projectName}}`: {{projectDescription}}.
- Repository: `{{projectUrl}}` (`{{repoId}}`).
- `libraries/*/`: publishable packages (`src/index.ts` entry, `src/*.test.ts` colocated tests via `vitest`, `package.json` `exports` point to `dist/**`, built with `quickbundle`). The initial one is `libraries/{{projectName}}/`.
- `applications/*/`: runnable apps depending on `libraries/*` via `workspace:`.
- Cross-package imports only via workspace package names: no relative imports across `applications`/`libraries` boundaries.
- `examples/*/`: private playground apps (excluded from build/check orchestration).
- `tools/*/`: private local tooling packages.
- Root configs (`oxlint.config.ts`, `oxfmt.config.ts`, `tsconfig.json`, `turbo.json`) just re-export `@adbayb/stack` shared presets: extend, don't replace.
- pnpm workspace members: `applications/*`, `libraries/*`, `examples/*`, `tools/*` (`pnpm-workspace.yaml`, `saveExact: true`).
- If a package needs tailored guidance, add a nested `AGENTS.md` inside it: agents read the nearest file, so it takes precedence over this root one.

## Bootstrap

Follow this order:

- Requires Node `{{nodeVersion}}` and pnpm `{{pnpmVersion}}` (`devEngines` in root `package.json`).
- After `stack create`: `pnpm install --frozen-lockfile`, then `stack install`.
- `stack install` writes `.git/hooks/pre-commit` (`stack fix <changed-files> && git add -A`) and `commit-msg` (`stack check --filter commit`). Re-run it if hooks are missing.

## Commands

Root scripts (`package.json`) are thin wrappers around `stack`, which wraps turbo / oxlint / oxfmt / commitlint / changesets / quickbundle. Always use these, not raw tools:

- `pnpm build` (`stack build` → `turbo run build`, cached, outputs `dist/**`, builder is `quickbundle build`)
- `pnpm check` (`stack check`: builds first excluding examples, then dependency + formatting + code checks (commit checked separately via `--filter commit` or the `commit-msg` hook); always builds first unless `--filter commit`)
- `pnpm fix` (`stack fix`: auto-fixable oxlint `--fix-dangerously` + oxfmt `--write`)
- `pnpm test` (`stack test` → `turbo run test`, `dependsOn: build`, so build runs first)
- `pnpm clean` (`stack clean`: deletes `git clean -fdXn` output, preserves `node_modules`, plus `node_modules/.cache`)
    - Untracked-but-ignored files are removed too; don't hand-delete `dist/`, use `stack clean`.
- Release via changesets: `pnpm release:changelog` (`--changelog`), `release:version` (`--bump`), `release:snapshot` (`--snapshot`), `release:publish` (`--publish`)

Focused verification: `stack check --filter <code|formatting|dependency|commit> [files...]` and `stack fix [files...]`. CI order (`.github/workflows/workflow.yml`) is `install --frozen-lockfile` → `build` → `check` → `test`.

### Testing instructions

- Run `pnpm check` and `pnpm test` before finishing; fix failures until green.
- Add or update tests for the code you change, even if nobody asked, provided each test earns its place (covers behavior, not coverage).

## Code style guidelines

Formatting is enforced by the shared `@adbayb/stack` presets (re-exported by root `oxlint.config.ts`/`oxfmt.config.ts`): comply via `stack fix`, never hand-format.
For new code, use the `software-design` skill when available (install via `npx skills add adbayb/stack --skill software-design -g` if missing); otherwise follow these defaults. On conflict the skill wins; this list stays compressed by design:

- KISS (Keep It Simple, Stupid) over cleverness; DRY (Don't Repeat Yourself) at knowledge level (rule of three before abstracting duplicated logic).
- Minimal API surface (YAGNI: You Aren't Gonna Need It): expose only what's needed now; small explicit functions, narrow interfaces.
    - Keep symbols local; promote to the lowest shared scope all consumers already depend on only for a second existing consumer (planned consumers and same-package tests excluded; published-API consumers included).
    - Exception: a contract both sides of a boundary must agree on may be shared right away. If tooling prevents sharing it, duplicate it and guard it with a test.
    - Before exporting across a boundary, check who imports it. Prefer sharing contracts over implementations. Never export a counterpart (e.g. a reader for a writer) ahead of its first consumer.
- POLA (Principle of Least Astonishment): names and behavior as expected; fail fast at boundaries, no surprise side effects.
- High cohesion, low coupling:
    - Keep code that changes together, or serves one responsibility, in one place.
    - Keep module/slice/package dependencies narrow, intentional, toward more stable lower-level code. No cycles.
- Maintainable, evolvable design: apply the following only when it solves a present need (YAGNI/KISS/rule of three still win; no speculative layers or patterns in small modules).
    - SOLID, especially Dependency Inversion (small interfaces, injected implementations), Single Responsibility (one purpose per unit), Open/Closed (extend via composition, not inheritance or branch edits), Interface Segregation (narrow, consumer-shaped interfaces). Liskov when subtyping.
    - Design patterns when the problem matches: Adapter (wrap external APIs behind our contract), Facade (simple public API over complex internals), Strategy (swappable behavior per environment/config), Factory (creation varying by config or dependencies), Decorator (add cross-cutting behavior without touching the wrapped unit). Don't name a pattern in code unless it helps readers.
    - Hexagonal/ports-and-adapters at I/O boundaries (CLI args, env, files, network, storage, third-party SDKs): pure testable domain logic without I/O; I/O behind ports implemented by edge adapters; dependencies point inward.
- Testing: verify behavior, keep the suite lean.
    - Test functional behavior through the public interface, not implementation details (internal calls, private structure, call order unless it is the contract). A refactor that keeps behavior must not break tests.
    - Every test must earn its place: never write tests to raise line count or coverage.
    - Consolidate overlapping cases (e.g. `test.each`); remove redundant, obsolete or implementation-coupled tests in files you edit, listing removals and reasons in the change summary.
    - One behavior per test, named by scenario and expectation; keep tests FIRST (fast, independent, repeatable, self-validating); cover boundaries and failure paths, not just the happy path.
- Code organization: public-facing interface first (exports before implementation in source files, describes/tests before helpers in test files; no use-before-define of `const` helpers at module load). Order top-down (callers above callees); public/exported APIs carry a one-line TSDoc (`/** */`) stating the contract, with `@param`/`@returns` only when the description adds info beyond the types.
- Consistent naming: pick one verb per contract, use everywhere (POLA), never add synonym for something already named.
    - Queries (never throw; `undefined`/empty when missing): `get` (lookup by identity), `find` (search by criteria/filter), `exists`/`count`. A throwing lookup needs its own intention verb (e.g. `getOrThrow`). Collections use a plural noun, never an `All` infix (`getOrders`, `findOverdueOrders`, not `getAllOrders`).
    - Commands: `create`/`update`/`remove` for lifecycle; intention verbs for domain behavior (`refundOrder`, not `setStatus`).
    - Banned → use: `fetch`/`retrieve`/`load`/`read` → `get`, `query`(verb) → `find`/`exists`, `delete`/`clear` → `remove`, `add`/`insert`/`save` → `create`/`update`, `set` → intention verb (DTOs/builders and React state setters exempt), `process`/`handle`/`manage`/`do` → specific intention verb, `data`/`info`/`util` → domain noun. Third-party and platform APIs (e.g. `fetch`) keep their own names. Apply to new and edited code; don't rename existing exported symbols just for this.
    - Booleans: `is*`/`has*`/`can*`. Handlers: `on<Event>`.
    - Generic utilities: `input`/`...inputs` for domain-less parameters, `output` for domain-less results (instead of `data`/`arg`/`x`); domain meaning always wins (`userId`, never `input`).
    - Boundary contracts: bespoke input/output shapes take `<FunctionName>Input` / `<FunctionName>Output`; reuse domain types otherwise, never alias per function.
    - Functions verb-first (`findOverdueOrders`), classes/types nouns (`OrderRefunder`), no stutter (`orders.get(id)` not `orderRepo.getOrder`).
    - Editing a file: match verbs already used in that slice, don't add a second synonym.
- Type inference: skip explicit return/output types when TypeScript can infer them; annotate only when a stricter type than inferred is wanted (e.g. an enum instead of `string`) or when an exported API contract should be explicit.
- Explicit logic: name the middle steps (explanatory variables, encapsulated boolean conditions); prefer positive conditionals. Every name must earn its place: single-use consts without meaning, await, narrowing, or literal get inlined. Make dependencies physical (import, parameter, injection); never require a call order or rely on ambient execution order. Every default, limit, timeout, and retry count is a named constant with a stated reason at module top.
- Strict types: never silence the type checker (`as any`, `@ts-ignore`/`@ts-expect-error`, non-null `!`); absence is `undefined`, never `null`. Size names to their scope; no type prefixes, encodings, or `Manager`/`Helper`/`Util` holders.
- Error handling: prefer Result objects from `@open-vanilla/result` over throwing for normal control flow; map foreign exceptions to failed Results at the boundary. Expected absence stays `undefined`/empty (queries never throw). New and edited code only; don't migrate existing throw-based code.
- Avoid comments: prefer self-explanatory code; comment only the why (complex logic, non-obvious workflows, deliberately preserved ambiguous patterns). No narration of readable code, no commented-out code.
- Neutral artifacts: generated text (source, docs, comments, commit messages, changelogs) must not contain symbols that identify model contribution.
    - Never emit em-dashes (`—`, U+2014) anywhere; restructure the sentence or use a hyphen (`-`), colon, comma, or parentheses instead.
    - Never emit a decorative en-dash (`–`, U+2013) or double hyphen; use a hyphen (ranges fine).
    - Never emit invisible unicode (U+00A0, U+200B-U+200D, stray BOM); use a regular space or delete.
    - Curly quotes and the ellipsis glyph (`…`, U+2026) are fine in prose but forbidden in code, comments, and copy-pasteable samples (they break pasted code).
    - Same for other decorative non-ASCII punctuation.
    - Apply to text you write or edit; don't rewrite existing files just for this.
- Avoid assumptions: when the approach is ambiguous and a wrong guess is costly to undo, ask before proceeding. Otherwise pick the sensible default and state it.
- Boy Scout Rule: leave code better than found. In edited files, make small, safe, behavior-preserving improvements (no exported renames) and mention them in the change summary. Larger or cross-file cleanup goes in a separate change.

## Security considerations

- Never commit secrets (tokens, credentials): use environment variables and keep `.env*` git-ignored. Never log or print secrets; keep them out of error messages.
- Validate untrusted input (CLI args, env, files, network) once at the boundary; fail fast with actionable errors.
- Never interpolate untrusted input into shell commands: use parameterized exec helpers, never raw shell strings.
- Keep file writes scoped to the narrowest path set; destructive operations (`clean`) fail closed on ambiguous scope and never delete outside it.
- Pin devDependencies exact (`saveExact: true`, or `workspace:*` for local packages); prefix `dependencies`/`peerDependencies` with a caret (or `workspace:^` for local dependencies: peers stay explicit); `stack check` verifies them: review automated dependency updates (Renovate) before merging.

## PR instructions

- Title follows Conventional Commits (enforced via commitlint + `commit-msg` hook); CI must be green before merge.
- Before requesting review: `pnpm check` passes, valuable tests added, changelog entry included for non-internal changes (`pnpm release:changelog`).
