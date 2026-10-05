# Audit Checklist

Use top-down. Check each box or record a finding with severity. Acronyms are expanded once in the `code-audit` SKILL.md glossary. Rule versions follow `software-design` — on conflict the skill wins; update this file instead of forking the rule.

## A. Minimal API surface / blast radius

- [ ] Each public function/class/endpoint serves one current requirement (YAGNI — no "future" params, flags, resources).
- [ ] ≤3–4 parameters; no boolean traps; complex input uses a Parameter Object.
- [ ] Commands mutate or queries return — not both (CQS).
- [ ] Inputs validated once at the boundary; domain assumes typed input (Fail-Fast).
- [ ] No infrastructure types in public signatures (ORM entities, `Request`/`Response`, SDK DTOs).
- [ ] Removal cost known: changing this signature touches ≤1 slice.

## B. Structure (vertical slice + inner style)

Apply ports/barrel/presenter rows only where the inner style requires them — flat scripts and MVVM slices are exempt from ports ceremony (YAGNI, Gall's Law). When exempt, note the inner style and skip without a finding.

- [ ] Code lives with its capability (`src/<feature>/`), not in global `services/`/`utils/` sprawl.
- [ ] Dependency direction is inward: domain ← ports ← adapters; domain imports nothing infrastructural.
- [ ] No cross-slice deep imports; inter-slice traffic via explicit contract or event.
- [ ] Shared code is genuinely shared (3+ users, single owner) — otherwise co-located.
- [ ] Module boundaries respected: workspace packages, imports via package names only, no cross-module deep imports.
- [ ] Imports via barrel entry points (`index.ts`) for hexagonal/clean modules; flat/MVVM slices may import directly; boundaries encoded in linter/`exports`, not convention alone.
- [ ] Inner style is consistent per module (per application when there are no modules) and documented in one line.
- [ ] Controllers and presenters separated for clean modules (presenters push through the application layer, controllers never format output); flat/hexagonal/MVVM slices exempt.

## C. SOLID / GRASP

- [ ] One reason to change per unit (SRP). No Divergent Change.
- [ ] New variants added without editing stable files (OCP) — no recurring Shotgun Surgery.
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

## E. Clean code, cohesion, testability

- [ ] Names reveal intent; no `data/tmp/manager/process`. Verb prefixes consistent: `get` (one by identity, no throw) / `getAll` (collection, with optional filters/pagination, no throw) / `find`/`findAll` (search, optional/filtered — absent → `undefined`/empty) / `exists` for queries, `create` / `update` / `remove` for commands; no `fetch`/`retrieve`/`load`/`read`/`list`/`query`/`delete`/`clear`/`save`/`process` synonyms.
- [ ] Functions small, single-purpose, guard-claused; nesting ≤2.
- [ ] High cohesion: change X → ≤3 files touched. Low coupling: no globals, no hidden I/O.
- [ ] Law of Demeter holds; Tell-Don't-Ask; no surprise side effects (POLA).
- [ ] Domain unit-testable with fakes (clock/repo/mailer injected); tests colocated (`*.test.ts`); pyramid respected (many unit, few integration).
- [ ] Errors typed at boundaries and mapped once at adapters/hosts; queries never throw, expected absence is `undefined`/empty.
- [ ] Boy Scout applied: touched code left cleaner, unrelated reform kept separate.

## Severity guide

- Blocker: leaks I/O into domain, untestable business rule, data-loss/security adjacent, broken layering.
- Major: fat API, SRP/OCP/ISP/DIP violation, cross-slice coupling, repeated switch, untestable seam.
- Minor: naming, nesting, boilerplate duplication, comment/style — fix when touching the lines anyway.
