# Audit Checklist

Use top-down. Check each box or record a finding with severity. Acronyms are expanded once in the `code-audit` SKILL.md glossary.

## A. Minimal API surface / blast radius

- [ ] Each public function/class/endpoint serves one current requirement (YAGNI — no "future" params, flags, resources).
- [ ] ≤3–4 parameters; no boolean traps; complex input uses a Parameter Object.
- [ ] Commands mutate or queries return — not both (CQS).
- [ ] Inputs validated once at the boundary; domain assumes typed input (Fail-Fast).
- [ ] No infrastructure types in public signatures (ORM entities, `Request`/`Response`, SDK DTOs).
- [ ] Removal cost known: changing this signature touches ≤1 slice.

## B. Structure (vertical slice + clean inside)

- [ ] Code lives with its capability (`features/<cap>/`), not in global `services/`/`utils/` sprawl.
- [ ] Dependency direction is inward: domain ← ports ← adapters; domain imports nothing infrastructural.
- [ ] No cross-slice deep imports; inter-slice traffic via explicit contract or event.
- [ ] Shared code is genuinely shared (3+ users, single owner) — otherwise co-located.
- [ ] Inner style is consistent per slice (hexagonal/clean/MVVM/flat) and documented in one line.

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

- [ ] Names reveal intent; no `data/tmp/manager/process`. Verb prefixes consistent: `get` (throws if absent) / `find` (null if absent) / `list` / `exists` for queries, `create` / `update` / `remove` for commands; no `fetch`/`retrieve`/`save`/`delete` synonyms.
- [ ] Functions small, single-purpose, guard-claused; nesting ≤2.
- [ ] High cohesion: change X → ≤3 files touched. Low coupling: no globals, no hidden I/O.
- [ ] Law of Demeter holds; Tell-Don't-Ask; no surprise side effects (POLA).
- [ ] Domain unit-testable with fakes (clock/repo/mailer injected); pyramid respected (many unit, few integration).
- [ ] Boy Scout applied: touched code left cleaner, unrelated reform kept separate.

## Severity guide

- Blocker: leaks I/O into domain, untestable business rule, data-loss/security adjacent, broken layering.
- Major: fat API, SRP/OCP/ISP/DIP violation, cross-slice coupling, repeated switch, untestable seam.
- Minor: naming, nesting, boilerplate duplication, comment/style — fix when touching the lines anyway.
