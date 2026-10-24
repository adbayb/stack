---
name: software-design
description: "Design and write readable, maintainable, testable clean code. Use whenever creating or changing code, APIs, classes, modules, features, or project structure, even when the user never mentions architecture, SOLID, design patterns, hexagonal, vertical slice, or clean code. Enforces minimal API surface, SOLID/GRASP, cohesion/coupling, justified patterns, and one owner per piece of knowledge."
license: MIT
metadata:
    author: adbayb
    repository: adbayb/stack
    version: "1.0.0"
---

# Software Design

Apply to every non-trivial code change, not only when the user asks for architecture. Non-trivial means a behavior, API, structure, dependency, security, or business-rule change; mechanical edits, formatting, and config-only changes without behavior impact are exempt. Repo rules override this skill; references win over this file on rule conflicts.

## Acronym glossary

Bare acronyms are expanded once here; references rely on this glossary.

- **SOLID**: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion.
- **GRASP**: General Responsibility Assignment Software Patterns. **GoF**: Gang of Four.
- **SRP / OCP / LSP / ISP / DIP**: the five SOLID principles, in order.
- **YAGNI**: You Aren't Gonna Need It. **KISS**: Keep It Simple, Stupid. **DRY**: Don't Repeat Yourself.
- **POLA**: Principle of Least Astonishment. **CQS**: Command Query Separation. **CQRS**: Command Query Responsibility Segregation.
- **FIRST**: Fast, Independent, Repeatable, Self-validating, Timely.
- **REST**: Representational State Transfer. **RPC**: Remote Procedure Call. **MVC**: Model-View-Controller. **MVVM**: Model-View-ViewModel. **MVP**: Model-View-Presenter.
- **API**: Application Programming Interface. **I/O**: Input/Output. **DB**: database. **DTO**: Data Transfer Object. **ORM**: Object-Relational Mapper. **SDK**: Software Development Kit. **HTTP**: Hypertext Transfer Protocol. **CLI**: Command-Line Interface. **FS**: file system.
- **DI**: Dependency Injection. **ID**: identifier. **OO**: object-oriented. **SQL**: Structured Query Language. **UI**: user interface. **JSON**: JavaScript Object Notation. **ASCII**: American Standard Code for Information Interchange. **PR**: pull request. **CRUD**: Create, Read, Update, Delete.

## Workflow

Follow in order; skip only with a reason. Ask when a wrong guess is costly; otherwise choose the sensible default and state it.

### 1. Shape the slice

- Load `references/architecture-styles.md`; decide the slice boundary and inner style before writing code.
- State the choice in one sentence.

### 2. Design the public surface

- Load `references/api-surface.md` before adding or changing a public API, domain invariant, value representation, persistence contract, or transaction boundary.
- Load the naming convention in `references/clean-code.md` before naming new functions, types, or modules, public or internal.

### 3. Assign responsibilities

- Load `references/solid-grasp.md` before defining classes, modules, interfaces, or dependencies.

### 4. Keep it simple and decoupled

- Load `references/cohesion-coupling.md` for sharing, collaboration, resource ownership, and retry safety.
- Keep larger cleanups separate from the current change.

### 5. Use patterns only for present pain

- Load `references/patterns.md` before introducing a named pattern.

### 6. Make it clean, tested, secure

- Load `references/clean-code.md`, `references/testing-refactoring.md`, and `references/security.md` before finishing.
- Scan `references/smells-antipatterns.md` against touched code.
- Run relevant tests and record verification.

## Output

For a non-trivial implementation, close with a short design note covering the relevant items below; omit unchanged or inapplicable items.

- Slice: capability and location.
- API surface: what is newly public and why nothing more was added.
- Inner style: chosen style and dependency direction.
- Principles/patterns: only those that changed a decision.
- Testability and verification: how the domain is tested without I/O; what ran.

Do not repeat the change summary or dump theory.

## Example

Request: "Add a refund endpoint."

- Slice: `src/refund/` owns the use case end to end.
- API surface: `refundOrder(input: RefundOrderInput): Result<Refund>`; no speculative flags or routes.
- Inner style: flat modular; the use case depends on an injected payment port.
- Principles/patterns: SRP at the use-case boundary; no named pattern needed.
- Testability and verification: fakes replace the payment port and clock; approval, rejection, and missing-order tests and type checks pass.

## Missing rule?

If a rule is missing or ambiguous, report the gap and follow `references/sources.md`.
