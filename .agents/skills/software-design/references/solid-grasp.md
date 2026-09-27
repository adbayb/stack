# SOLID + GRASP

Apply when defining classes, modules, interfaces, or dependency graphs. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## SOLID

- **S — Single Responsibility.** One actor, one reason to change. Split when a class mixes policy (rules), coordination (orchestration), and I/O. Symptom of violation: Divergent Change (one class edited for unrelated reasons).
- **O — Open/Closed.** Open for extension, closed for modification. Add new behavior via new types/strategies/handlers, not by editing a switch in stable code. Symptom: Shotgun Surgery on every new variant.
- **L — Liskov Substitution.** Any subtype must be usable through the parent contract without surprises. Do not weaken preconditions or strengthen postconditions; do not throw `NotImplemented` from an inherited method (Refused Bequest). Prefer composition if the is-a is fake.
- **I — Interface Segregation.** No fat interfaces. Split `Repository` into `Reader`/`Writer` if callers need only one side; split callbacks so clients implement only what they use. Violation smell: unused dependencies injected "just in case".
- **D — Dependency Inversion.** Domain depends on ports (interfaces it owns); adapters (DB, HTTP, FS, clock) implement them. Wire at the composition root. Never `import { db } from "./infra"` inside domain code; never leak `Request`, `ResultSet`, or SDK types across the boundary.

## GRASP (responsibility assignment)

- **Information Expert:** put behavior where the data lives.
- **Creator:** B creates A if B aggregates, contains, or closely uses A.
- **Controller:** one non-UI coordinator per use case; thin, delegates to domain.
- **Low Coupling / High Cohesion:** prefer the assignment that reduces cross-module chatter.
- **Polymorphism / Protected Variations:** isolate volatile points behind an interface; use Strategy/Policy instead of conditionals.
- **Pure Fabrication / Indirection:** introduce a port/adapter or mediator only to protect the domain, not for ceremony.

## Composition over inheritance

- One inheritance level max for true is-a. Beyond that: compose, delegate, or inject a Strategy.
- Inheritance red flags: subclass ignores inherited methods, overrides to no-op/throw, needs parent internals (Inappropriate Intimacy).
- Refactors: Replace Inheritance with Delegation; Replace Conditional with Polymorphism; Extract Interface.

## Quick checks

1. Can I describe this unit's job in one sentence without "and"?
2. Can I add the next variant without editing this file?
3. Can I test it with fakes for all I/O?
4. Does every injected dependency get used?
