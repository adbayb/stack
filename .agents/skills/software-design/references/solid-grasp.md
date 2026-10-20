# SOLID + GRASP

Apply when defining classes, modules, interfaces, or dependency graphs. Use the inner style chosen in `architecture-styles.md`; apply these principles to functions and modules as well as classes. They do not require an interface, class, or layer for each role.

## SOLID

- **S: Single Responsibility.** One actor, one reason to change. Split unrelated policy, coordination, and I/O when they change independently; a cohesive flat transaction script may coordinate its own I/O. Symptom of violation: Divergent Change (one unit edited for unrelated reasons).
- **O: Open/Closed.** Protect stable policy from recurring variant changes. A local, exhaustive switch over a closed union is fine; introduce a strategy or handler when repeated variation causes Shotgun Surgery. Apply the selection gate in `patterns.md`.
- **L: Liskov Substitution.** Any subtype must be usable through the parent contract without surprises. Do not strengthen preconditions or weaken postconditions; do not throw `NotImplemented` from an inherited method (Refused Bequest). Prefer composition if the is-a is fake.
- **I: Interface Segregation.** No fat interfaces. Split `Repository` into `Reader`/`Writer` if callers need only one side; split callbacks so clients implement only what they use. Violation smell: unused dependencies injected "just in case".
- **D: Dependency Inversion.** In layered styles, domain depends on inner-owned ports; adapters implement them and the composition root wires them. Follow `architecture-styles.md` for dependency direction and flat-slice exemptions; use `api-surface.md` for infrastructure type boundaries. A function parameter can supply a seam without a new interface.

## GRASP (responsibility assignment)

- **Information Expert:** put behavior where the data lives.
- **Creator:** B creates A if B aggregates, contains, or closely uses A.
- **Controller:** one non-UI coordinator per use case; thin, delegates to domain.
- **Low Coupling / High Cohesion:** prefer the assignment that reduces cross-module chatter.
- **Polymorphism / Protected Variations:** isolate demonstrated volatile points behind an interface; follow `patterns.md` before replacing conditionals.
- **Pure Fabrication / Indirection:** introduce a port/adapter or mediator only to protect the domain, not for ceremony.

## Composition over inheritance

- Prefer composition and keep true is-a hierarchies shallow. More than one inheritance level is a review signal, not an automatic violation; retain it only when each subtype honors its parent contract and the hierarchy expresses a stable domain relationship.
- Inheritance red flags: subclass ignores inherited methods, overrides to no-op/throw, needs parent internals (Inappropriate Intimacy).
- Refactors: Replace Inheritance with Delegation; Replace Conditional with Polymorphism; Extract Interface.

## Quick checks

1. Does this unit serve one cohesive purpose and actor, with no unrelated reasons to change?
2. Do variant changes force edits across otherwise stable units?
3. Can I test it with fakes for all I/O?
4. Does every injected dependency get used?
