# Minimal API Surface

Goal: smallest public surface that satisfies current product requirements. Every public name is a promise (Hyrum's Law). Acronyms are expanded once in the `software-design` SKILL.md glossary.

## YAGNI gate

Before adding any resource, relation, action, field, flag, or option, answer:

1. Which stated requirement needs it today?
2. What breaks if it is added later instead?
3. What is the removal cost once shipped?

If (1) has no answer, do not add it. Speculative Generality and Second-System Effect both start as "might need".

## Design rules

- **One purpose per unit.** Endpoints, functions, and classes do one thing. Split commands from queries (CQS): `createOrder()` returns an id or throws; `getOrder()` has no side effects.
- **Few, explicit parameters.** More than 3–4 params → Introduce Parameter Object, or the function does too much. No boolean traps: `send(email, true)` → `sendWelcome(email)` / `sendReset(email)`.
- **Narrow interfaces.** Prefer `create(order: Order)` over `create(data: any)`. Return domain types, not driver rows. Never expose pagination cursors, SQL fragments, or SDK errors.
- **Validate at the edge.** Parse/validate once at HTTP/CLI/queue boundary into a typed command; domain assumes valid input. Fail fast with actionable errors.
- **Hide what can change.** Keep ordering, retries, batching, and storage choices internal. Expose facts and intents, not mechanisms.
- **No leakage.** Infrastructure types (ORM entities, `Request`/`Response`, SDK DTOs) stop at the adapter. Map to domain at the port.
- **Transactions at the use-case boundary.** One transaction per use-case execution, owned by the application layer (unit-of-work port or host-provided); entities never manage connections or transactions, gateways participate but never initiate.

## REST / RPC / library checklist

- [ ] No unused fields, flags, or endpoints "for later".
- [ ] No plural/reserved route that duplicates another path to the same thing.
- [ ] No relation expanded by default that most callers ignore.
- [ ] Errors are typed and stable; no stack traces or driver messages leak.
- [ ] Versioning story is explicit if the API is external; internal ports stay small enough to change safely.
- [ ] Blast radius noted: who breaks if this signature changes? Keep the answer to one slice if possible.
