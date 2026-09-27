# Design Patterns — use sparingly

Source catalog: https://refactoring.guru/design-patterns. Patterns are tools, not goals. Speculative pattern use is the Speculative Generality smell. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## Selection rule

Cite the concrete pain before naming a pattern: "three checkout variants with switching logic" → Strategy; "complex object with 8 optional fields" → Builder. If there is no pain yet, write the plain code (YAGNI).

## Creational

- **Factory Method / Abstract Factory:** object family varies by environment or tenant; callers must not know concrete classes.
- **Builder:** telescoping constructors or unreadable option bags. Provide a fluent/stepwise builder returning an immutable result.
- **Prototype:** expensive-to-create objects cloned with tweaks.
- **Singleton:** avoid. If you think you need one, inject a single instance instead so tests can replace it. Global mutable singletons kill testability.

## Structural

- **Adapter:** translate an external SDK/DB driver into a domain-owned port. All infrastructure translation lives here — nothing leaks past it.
- **Facade:** simplify a noisy subsystem behind one intention-revealing entry per slice.
- **Decorator / Middleware / Proxy:** add orthogonal behavior (logging, retry, cache, auth) without editing core logic.
- **Bridge / Composite / Flyweight:** only for genuine structural variation (renderers, trees, shared heavy objects). Do not reach for these in business CRUD.

## Behavioral

- **Strategy:** replace switch-statements / if-chains over a type code with interchangeable policies. Pairs with Open/Closed.
- **Command:** encapsulate a use case as an object (queue, undo, audit log).
- **Observer / Pub-Sub:** notify other slices of domain events without direct coupling. Keep events immutable facts about the past.
- **State / Template Method:** lifecycle with well-defined transitions; otherwise prefer explicit functions + guard clauses.
- **Chain of Responsibility / Mediator:** pipeline or coordinator that keeps handlers ignorant of each other.
- **Iterator / Memento / Visitor:** rarely needed in application code; prefer language iteration, snapshots, and pattern matching.

## Anti-guidance

- One pattern per problem. Stacking Decorator+Proxy+Mediator "for flexibility" is over-engineering.
- Framework-native first: pure functions, union types, DI, middleware, events usually beat a GoF implementation.
- Each introduced pattern must be removable: depend on the abstraction so the pattern can be unwound without touching callers.
