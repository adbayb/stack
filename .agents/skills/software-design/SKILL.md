---
name: software-design
description: "Design and write readable, maintainable, testable clean code. Use whenever creating new code, APIs, classes, modules, features, or choosing project structure: even if the user never says architecture, SOLID, design patterns, hexagonal, vertical slice, or clean code. Enforces SOLID, minimal API surface with YAGNI, KISS DRY Law of Demeter POLA, high cohesion low coupling, justified patterns only, an inner style inside vertical slices."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    version: "1.0.0"
---

# Software Design

Produce code that is readable, maintainable, testable, and clean. Apply this skill to every new file, feature, API, class, or module, not only when the user asks for "good architecture".

## Acronym glossary

Acronyms are expanded once here: body content uses them bare. Every reference file relies on this glossary.

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **GRASP**: General Responsibility Assignment Software Patterns.
- **SRP / OCP / LSP / ISP / DIP**: the Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion Principles.
- **YAGNI**: You Aren't Gonna Need It.
- **KISS**: Keep It Simple, Stupid.
- **DRY**: Don't Repeat Yourself.
- **POLA**: Principle of Least Astonishment.
- **CQS**: Command Query Separation. **CQRS**: Command Query Responsibility Segregation.
- **FIRST**: Fast, Independent, Repeatable, Self-validating, Timely.
- **REST**: Representational State Transfer. **RPC**: Remote Procedure Call. **MVC**: Model-View-Controller. **FS**: file system. **BOM**: byte-order mark.
- **DI**: Dependency Injection. **ID**: identifier. **OO**: object-oriented. **SQL**: Structured Query Language. **UI**: user interface. **JSON**: JavaScript Object Notation. **ASCII**: American Standard Code for Information Interchange.
- **MVVM**: Model-View-ViewModel. **MVP**: Model-View-Presenter.
- **CRUD**: Create, Read, Update, Delete.
- **API**: Application Programming Interface. **I/O**: Input/Output. **DB**: database. **DTO**: Data Transfer Object. **ORM**: Object-Relational Mapper. **SDK**: Software Development Kit. **HTTP**: Hypertext Transfer Protocol. **CLI**: Command-Line Interface.
- **DI**: Dependency Injection. **IoC**: Inversion of Control. **GoF**: Gang of Four.

## Workflow

Follow these steps in order. Skip a step only with an explicit reason. When the approach is ambiguous and a wrong guess is costly to undo, ask before proceeding; otherwise pick the sensible default and state it. Single source: reference files are normative. Workflow steps summarize them and must never fork their rules. When a rule changes, edit the reference first, then trim any workflow recap.

### 1. Clarify the slice

- Identify the single business capability being built. One slice = one use case, end to end.
- Organize by feature (vertical slice), not by technical layer: one folder per feature under `src/`; folder rules and naming per `references/architecture-styles.md`.
- Choose one inner style per module (per application when there are no modules) and state it in one sentence:
    - Swappable adapters/testability → hexagonal; enterprise rules shared across apps/modules → clean architecture, per `references/architecture-styles.md` (inner layers isolated from I/O).
    - UI-driven → MVVM or equivalent, with view-models free of I/O side effects.
    - Simple CRUD/script → keep it flat; do not invent hexagons you do not need (YAGNI, Gall's Law: simple system first).
- If the repo already has a convention, follow it. Do not introduce a second architecture style without migrating.

See `references/architecture-styles.md` for the decision table.

### 2. Design the minimal API surface

Every public function, class, endpoint, or interface is a liability (Hyrum's Law: everything observable will be depended upon).

- Start from product requirements. Expose only what is required now: no speculative resources, relations, flags, or "future-proof" hooks (YAGNI, Second-System Effect).
- Prefer small, explicit surfaces: few parameters, one purpose per function, narrow interfaces.
- Apply Command Query Separation: a method either changes state or returns data, not both. Pragmatic exception: a command may return the created identity or a Result; queries stay side-effect free.
- Fail fast at boundaries: validate inputs once at the edge, then trust internally.
- Hide internals: depend on abstractions (ports/interfaces), inject dependencies, never leak infrastructure types (DB clients, HTTP objects) into the domain: leaky abstractions are an anti-pattern.
- Place symbols at the lowest sufficient scope (see `references/api-surface.md`).
- When in doubt, do less. A smaller API that can grow is better than a large one that must shrink.

See `references/api-surface.md` for the checklist.

### 3. Apply SOLID and GRASP

Load `references/solid-grasp.md` when defining classes, modules, or dependencies.

Essentials:

- Single Responsibility: one reason to change per unit.
- Open/Closed: extend by adding code, not editing working code.
- Liskov Substitution: subtypes honor the parent contract: no weakened preconditions, no strengthened postconditions.
- Interface Segregation: many narrow interfaces beat one fat one; clients never depend on methods they do not use.
- Dependency Inversion: high-level policy depends on abstractions; wire concrete adapters at composition root via injection.
- GRASP tiebreakers: assign responsibilities to the Information Expert, keep Creator/Controller cohesive, protect against variations.

Favor composition over inheritance. One level of inheritance for genuine is-a; otherwise compose or use Strategy/Policy injection.

### 4. Keep it simple, explicit, decoupled

- KISS over cleverness. The simplest solution that satisfies the requirement wins (Occam's Razor).
- DRY at the knowledge level, not the text level: deduplicate business rules, tolerate duplicated boilerplate rather than couple unrelated slices with a premature abstraction. Rule of three before generalizing.
- Law of Demeter: `a.b()` is fine, `a.getB().getC().doX()` is not. Talk to friends, use Tell-Don't-Ask, inject what you need.
- Principle of Least Astonishment: names, signatures, and defaults behave as a competent reader expects. No surprise side effects, no boolean traps, no magic values.
- Boy Scout Rule: in edited files, small safe behavior-preserving improvements only (no exported renames); larger or cross-file cleanup goes in a separate change.
- High cohesion, low coupling: things that change together live together; slices communicate through narrow, explicit contracts pointing toward more stable, lower-level code. No cycles. See `references/clean-code-cohesion.md`.

### 5. Use design patterns only when justified

Load `references/patterns.md` before introducing any named pattern.

- No pattern "just in case": cite the concrete pain it solves (see `references/patterns.md`).
- Prefer language-native solutions first: pure functions, union types, dependency injection, middleware.
- Common safe defaults: Factory/Builder for complex construction, Strategy over switch-statements, Adapter/Facade at infrastructure boundaries, Observer/events for cross-slice notification, Decorator/middleware for orthogonal concerns.
- Treat Singleton/global state as guilty until proven innocent: pass dependencies explicitly for testability.

### 6. Make it testable and clean

- Pure domain logic separated from I/O: unit-testable without mocks of databases, clocks, or network.
- Inject seams: clock, ID generator, repository port, HTTP client: so tests substitute fakes, not mocks of everything.
- Colocate tests with source (`*.test.ts` next to implementation); fakes live beside the ports they implement.
- Test behavior through the public interface and keep the suite lean: every rule detail (naming, consolidation, one behavior per test, FIRST) per `references/clean-code-cohesion.md` (naming convention and clean-code rules).
- Keep the public-facing interface at the top of files: exports before implementation, describes/tests before helpers (also in `references/clean-code-cohesion.md`).
- Before finishing, run through `references/smells-antipatterns.md` and refactor every match.

## Output contract

For any non-trivial change, end with a short design note (5-15 lines):

- Slice: what capability, where it lives.
- API surface: what is newly public and why nothing more was added.
- Inner style: hexagonal/clean/MVVM/flat + dependency direction.
- Principles applied + patterns used (with justification) or "none".
- Testability: how to unit-test the domain without I/O.

Do not dump theory. Cite the principle only when it changed a decision.

## Example

Request: "Add a refund endpoint."

- Slice: `src/refund/` owns the use case end to end.
- API surface: `refundOrder(input: RefundOrderInput): Result<Refund>`; no extra flags, routes, or speculative fields.
- Inner style: flat modular with one injected payment port; no layers or patterns yet.
- Principles applied: SRP at the use-case boundary; none of the optional patterns.
- Testability: inject the payment port and clock; test approval, rejection, and missing-order paths with fakes.

## External sources (appendix, informative only)

Normative rules are above; on conflict this skill wins. Do not add patterns or APIs from external sources without a current requirement (YAGNI).

When a rule is missing or ambiguous above, consult these sources and apply the most relevant guidance that impacts code design and quality:

- SOLID principles: https://awesome-architecture.com/topics/software-architecture-principles-solid.
- Design Patterns: https://refactoring.guru/design-patterns.
- Code smells: https://refactoring.guru/refactoring/smells: and anti-patterns such as leaky abstractions: https://awesome-architecture.com/collections/software-architecture/anti-patterns.
- Minimal API surface / blast radius: every API design must aim for a minimal API surface without sacrificing product requirements; it should not include unnecessary resources, relations, actions, or data; it should not add functionality until deemed necessary (YAGNI principle).
- Architecture principles: https://awesome-architecture.com/collections/software-architecture/principles and https://lawsofsoftwareengineering.com/: this skill already enforces KISS, YAGNI, Boy Scout Rule, DRY, Law of Demeter, Principle of Least Astonishment, ...; pick up any missing principle from these collections that impacts code design and quality.
- Hexagonal / clean architecture inside vertical slices: favor hexagonal or clean architecture for business-heavy slices; match the inner style to the situation per `references/architecture-styles.md` (MVVM for UI-heavy, flat for scripts/glue). Reference implementation (clean): https://github.com/adbayb/clean-architecture.
- Clean code: https://gist.github.com/cedrickchee/55ecfbaac643bf0c24da6874bf4feb08.
- Cohesion and coupling: https://awesome-architecture.com/topics/software-architecture-principles-cohesion and https://awesome-architecture.com/topics/software-architecture-principles-coupling: increase cohesion, minimize coupling.
