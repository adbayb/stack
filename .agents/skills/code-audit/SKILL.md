---
name: code-audit
description: Audit and fix existing code for architecture and quality violations. Use whenever reviewing, auditing, refactoring, cleaning tech debt, fixing code smells, SOLID violations, bloated APIs, tight coupling, or checking hexagonal clean vertical-slice compliance — even if the user just says review this, is this clean, or fix this code. Produces a severity-ranked report then applies minimal, behavior-preserving fixes.
---

# Code Audit

Audit existing code against the `software-design` practices, then fix it with minimal blast radius. If `software-design` is available, load it first and treat its references as the definition of done.

## Acronym glossary

Acronyms are expanded once here — body content uses them bare. SOLID = Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion. GRASP = General Responsibility Assignment Software Patterns. SRP/OCP/LSP/ISP/DIP = the Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion Principles. YAGNI = You Aren't Gonna Need It. KISS = Keep It Simple, Stupid. DRY = Don't Repeat Yourself. POLA = Principle of Least Astonishment. CQS = Command Query Separation. MVVM = Model-View-ViewModel. I/O = Input/Output. API = Application Programming Interface. IoC = Inversion of Control. DTO = Data Transfer Object. ORM = Object-Relational Mapper. SDK = Software Development Kit.

## Workflow

### 1. Scope the audit

- Confirm target: files, slice, or repo + non-goals. Do not boil the ocean.
- Note the intended inner style (hexagonal/clean/MVVM/flat) and slice boundaries from the codebase; if missing, state the assumption.
- Run existing tests/linters first to establish a baseline. Never refactor red code without noting it.

### 2. Detect (no fixes yet)

Read `references/checklist.md` and scan in this order:

1. **Blast radius & API surface** — public exports, params, flags, leaked infra types.
2. **Structure** — slicing violations, layering direction (inward only), cross-slice imports.
3. **SOLID/GRASP** — responsibility splits, fat interfaces, inheritance abuse, missing seams.
4. **Smells & anti-patterns** — bloaters, couplers, dispensables, change preventers, leaky abstractions.
5. **Clean code & coupling** — names, function size, Demeter chains, cohesion, testability (can domain run without I/O?).

Record each finding with: location (`path:line`), principle violated, why it matters, severity:

- **Blocker:** wrong behavior risk, leaked abstraction, untestable core, security/data-loss adjacent.
- **Major:** SOLID/API/coupling violation that raises change cost measurably.
- **Minor:** naming, duplication of boilerplate, style — batch under Boy Scout Rule.

### 3. Report before fixing

Always present this table first; proceed with fixes but stop for approval before anything destructive:

```markdown
## Audit findings

| #   | Location | Severity | Principle/Smell | Impact | Fix direction |
| --- | -------- | -------- | --------------- | ------ | ------------- |
```

Then: total counts by severity, and the 3 highest-leverage fixes. Do not list every lint nit as equal to a leaky domain.

### 4. Fix with minimal blast radius

- Fix Blockers first, then Majors that touch the current task. Leave unrelated Minors unless Boy Scout-cheap, and keep them in separate commits/changes.
- Preserve behavior: extract without changing semantics; add/adjust tests to lock behavior before restructuring (characterization tests if none exist).
- Fix order inside one file:
    1. Delete dead code.
    2. Narrow API (remove unused params/flags, introduce param objects).
    3. Break Demeter chains (inject).
    4. Extract responsibilities (SRP).
    5. Replace switches with Strategy.
    6. Insert ports/adapters at I/O edges.
    7. Rename for intent.
    8. Reduce comments to strictly necessary (why-only, ambiguous code).
- Keep public signatures stable where possible; when a signature must shrink, update all callers in the same change and note the blast radius.
- One responsibility per change. Do not mix a behavior change with a refactor.

### 5. Verify

- Re-run the affected tests plus linters/type checks. State what was run and the result.
- Re-scan the touched code against `references/checklist.md` — no new violations introduced.
- End with: what was fixed, what was deliberately left (and why, YAGNI), and suggested next audit slice.

## Rules

- Explain the why in one line per fix (principle → consequence), not theory dumps.
- Never add functionality, frameworks, or patterns while auditing. Removing speculative code is a fix; adding "flexibility" is not.
- If a fix would expand the API surface or cross slice boundaries, propose it and stop — do not unilaterally widen contracts.
