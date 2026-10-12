# Audit Checklist

Use top-down. Check each box or record a finding with severity. Acronyms are expanded once in the `code-audit` SKILL.md glossary. Rule versions follow `software-design`: on conflict the skill wins; update this file instead of forking the rule.

## A. Minimal API surface / blast radius

- [ ] Each public function/class/endpoint serves one current requirement (YAGNI: no "future" params, flags, resources).
- [ ] Symbols live at the lowest sufficient scope (promoted only for a second existing consumer); contracts preferred over implementations; importers checked before exporting across a boundary; no counterpart ahead of its first consumer.
- [ ] ≤3–4 parameters; no boolean traps; complex input uses a Parameter Object.
- [ ] Commands mutate or queries return: not both (CQS).
- [ ] Fail-fast at the boundary: inputs parsed once into typed commands; domain assumes valid input.
- [ ] No infrastructure types in public signatures (ORM entities, `Request`/`Response`, SDK DTOs).
- [ ] Removal cost known: changing this signature touches ≤1 slice.

## B. Structure (vertical slice + inner style)

Apply ports/barrel/presenter rows only where the inner style requires them: flat scripts and MVVM slices are exempt from ports ceremony (YAGNI, Gall's Law). When exempt, note the inner style and skip without a finding.

- [ ] Code lives with its capability (`src/<feature>/`), not in global `services/`/`utils/` sprawl.
- [ ] Dependency direction is inward: domain ← ports ← adapters; domain imports nothing infrastructural.
- [ ] No cross-slice deep imports; inter-slice traffic via explicit contract or event.
- [ ] Shared code is genuinely shared (3+ users, single owner): otherwise co-located.
- [ ] Module boundaries respected: workspace packages, imports via package names only, no cross-module deep imports.
- [ ] Imports via barrel entry points (`index.ts`) for hexagonal/clean modules; flat/MVVM slices may import directly; boundaries encoded in linter/`exports`, not convention alone.
- [ ] Inner style is consistent per module (per application when there are no modules) and documented in one line.
- [ ] Controllers and presenters separated for clean modules (presenters push through the application layer, controllers never format output); flat/hexagonal/MVVM slices exempt.

## C. SOLID / GRASP

- [ ] One reason to change per unit (SRP). No Divergent Change.
- [ ] New variants added without editing stable files (OCP): no recurring Shotgun Surgery.
- [ ] Subtypes honor parent contracts; no no-op/throw overrides (LSP, no Refused Bequest).
- [ ] Interfaces are narrow; no unused injected methods (ISP).
- [ ] Domain depends on owned ports; concretes injected at composition root (DIP + IoC).
- [ ] Behavior sits with its data (Information Expert); composition preferred over inheritance.

## D. Smells & anti-patterns

- [ ] No Long Method / Large Class / Primitive Obsession / Long Parameter List / Data Clumps.
- [ ] No Switch-on-type-code repeated across files (→ Strategy/Polymorphism).
- [ ] No Feature Envy / Inappropriate Intimacy / Message Chains (`a.b().c()`) / Middle Man.
- [ ] No dead, commented-out, speculative, or duplicated-rule code (Dispensables).
- [ ] No leaky abstraction, God Object, framework-decorated domain, or premature distribution.

## E. Clean code

- [ ] Names reveal intent; no `data/tmp/manager/process`. Verb prefixes consistent: `get` (lookup by identity, never throw) / `find` (search by criteria/filter) / `exists` for queries; collections as plural nouns, no `All` infix; `getOrThrow` for throwing lookups; `create` / `update` / `remove` for commands; no `fetch`/`retrieve`/`load`/`read`/`list`/`query`/`delete`/`clear`/`save`/`process` synonyms. Third-party/platform APIs keep their own names. New/edited code only: no renames of existing exported symbols just for this.
- [ ] Added/edited text is neutral: no em-dashes (`—`, U+2014), decorative en-dash/double-hyphen (use `-`), or invisible unicode (U+00A0/U+200B-U+200D/stray U+FEFF); curly quotes and ellipsis glyph (`…`) in prose only, never in code/comments/samples; no decorative non-ASCII punctuation.
- [ ] Functions small, single-purpose, guard-claused; nesting ≤2.
- [ ] Complex expressions use explanatory variables; boolean conditions encapsulated and positive (`isEnabled`, no double negatives).
- [ ] Every name earns its place: single-use consts add meaning, bind an await, narrow a type, or centralize a literal; pass-through aliases inlined.
- [ ] No hidden temporal coupling or ambient-order reliance; logical dependencies explicit (import/param/injection).
- [ ] No arbitrary literals: defaults/limits/timeouts are named constants with a reason, at module top or composition root.
- [ ] No type-checker silencing (`as any`, `@ts-ignore`, `!`) without narrow scope + why-comment; absence is `undefined`, never `null`.
- [ ] Names fit their scope; no encodings or `Manager`/`Helper`/`Util` holders.
- [ ] Generic utilities use `input`/`...inputs`/`output`; domain names everywhere else (no `data`/`arg`/`x`).
- [ ] Bespoke boundary contracts named `<FunctionName>Input`/`Output`; domain types reused directly, never aliased per function.
- [ ] Public interface first: exports before implementation in source files, describes/tests before helpers in test files, one-line TSDoc contract docs on public APIs; file reads top-down.
- [ ] Boy Scout applied: touched code left cleaner via small safe behavior-preserving improvements (no exported renames), unrelated/larger reform kept separate.

## F. Coupling, errors, testability

- [ ] High cohesion: change X → ≤3 files touched. Low coupling: no globals, no hidden I/O, no cycles; dependencies narrow, intentional, toward stable lower-level code.
- [ ] Law of Demeter holds; Tell-Don't-Ask; no surprise side effects (POLA).
- [ ] Domain unit-testable with fakes (clock/repo/mailer injected); tests colocated (`*.test.ts`); pyramid respected (many unit, few integration). Tests assert behavior via the public interface, not implementation details; every test earns its place (no coverage-fillers); overlapping cases consolidated (`test.each`); redundant/obsolete/implementation-coupled tests removed in touched files.
- [ ] One behavior per test, named by scenario/expectation; tests FIRST (fast, independent, repeatable, self-validating); boundaries and failure paths covered.
- [ ] New/edited code prefers success and failure as Result objects (`@open-vanilla/result`), no throwing for normal control flow; foreign exceptions caught at the boundary and mapped to failed Results; queries never throw (`getOrThrow` reserved for throw-based interop), expected absence is `undefined`/empty; hosts map failed Results to responses and logs. Existing throw-based code left alone.

## G. Security

- [ ] Untrusted input (CLI args, env, files, network) validated once at the boundary; fail fast with actionable errors.
- [ ] No shell-injection surface: untrusted input never interpolated into shell commands: parameterized exec helpers only.
- [ ] No secrets in code, logs, or error messages; file writes scoped to the narrowest path set; destructive ops fail closed on ambiguous scope.
- [ ] Least privilege for tokens/permissions; dependencies pinned and reviewed (no surprise upgrades).

## Severity guide

- Blocker: leaks I/O into domain, untestable business rule, data-loss/security adjacent, broken layering.
- Major: fat API, SRP/OCP/ISP/DIP violation, cross-slice coupling, repeated switch, untestable seam.
- Minor: naming, nesting, boilerplate duplication, comment/style: fix when touching the lines anyway.
