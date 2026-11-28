# Minimal API Surface

Rule: every API design targets the smallest surface that satisfies current product requirements. Do not add resources, relations, actions, fields, flags, or hooks until a current requirement needs them (YAGNI). Every public name is a promise; every observable behavior becomes a dependency; keep surfaces small (Hyrum's Law).

## YAGNI gate

Before adding any resource, relation, action, field, flag, or option, answer:

1. Which stated requirement needs it today?
2. What breaks if it is added later instead?
3. What is the removal cost once shipped?

If (1) has no answer, do not add it. Speculative Generality and Second-System Effect both start as "might need".

## Design rules

- **One purpose per unit.** Endpoints, functions, and classes serve one cohesive purpose. Split commands from queries (CQS): for example, `createOrder` mutates and returns the created identity or a success/failure outcome in the project's idiom; `getOrder(id)` does not change business state. Read-side I/O and adapter observability are allowed.
  This is the documented exception: a command may return the created identity or the project's standard success/failure outcome (such as a `Result` where idiomatic); queries never mutate.
- **Few, explicit parameters.** Prefer at most 3 parameters. At 4+, check whether the function has multiple responsibilities or its inputs form a cohesive parameter record (object/struct); use one when it improves clarity, otherwise keep the simple signature. Where the language's call conventions support it, put required inputs before at most one optional options record, so adding a required input does not follow an optional one (`scan(path, options, signal)` -> `scan(path, signal, options)`). Platform conventions such as callback-last APIs still win. No boolean traps: `send(email, true)` -> `sendWelcome(email)` / `sendReset(email)`.
- **Narrow interfaces.** Prefer a domain type over an unbounded or dynamic input type (in TypeScript, for example, `any`). Return domain types, not driver rows. Keep storage-native cursors, SQL fragments, and SDK errors internal; expose an opaque pagination token only when a current contract needs it.
- **Input and invariants.** Follow `security.md` for untrusted-input validation. Parse transport shape at the adapter; enforce business invariants in domain constructors and transitions for every entry path, including internal callers. Use types to prevent invalid states where practical; do not repeat transport parsing inside the domain.
- **Hide what can change.** Keep ordering, retries, batching, and storage choices internal. Expose facts and intents, not mechanisms.
- **No leakage.** Infrastructure types (ORM entities, `Request`/`Response`, SDK DTOs) stop at the adapter. Map to domain at the port.
- **Lowest sufficient scope.** Keep symbols local; use `cohesion-coupling.md` for promotion thresholds. Check importers before exporting; prefer contracts over implementations; never export a counterpart (e.g. a reader for a writer) before its first consumer. Exception: a boundary contract both sides must agree on may be shared immediately; if tooling prevents sharing it, duplicate it and guard it with a test.
- **Transactions at the use-case boundary.** Define the atomic writes for each use case and use a transaction when they must succeed together. The application layer owns its scope (unit-of-work port or host-provided); entities never manage connections, gateways participate. Do not hold a database transaction across unrelated network calls or assume it rolls back external effects. State how partial failures recover; introduce an outbox or compensation only when the required consistency needs it.
- **Concurrent updates.** Protect read-check-write invariants with an atomic conditional write, uniqueness constraint, suitable isolation, or version check; an in-memory check alone is insufficient across workers. Define conflict behavior. Follow `cohesion-coupling.md` for repeated side effects and retries.
- **Value semantics.** Model distinct states with discriminated unions or equivalent types when flags allow invalid combinations; check variants exhaustively. Preserve invariants when values cross mutable aliases. For money, quantities, or timestamps, state the unit, precision/rounding, and time-zone meaning; use exact arithmetic when binary floating-point would violate the contract.
- **Contract evolution.** Check source, wire/storage, and behavioral compatibility, including error shapes and defaults. Keep migrations explicit and compatible with mixed-version readers/writers when deployment requires it; coordinate all callers for an intentional breaking change.

## REST / RPC / library checklist

- [ ] No unused fields, flags, endpoints, or "future" hooks.
- [ ] No plural/reserved route that duplicates another path to the same thing.
- [ ] No relation expanded by default that most callers ignore.
- [ ] Errors are typed and stable; no stack traces or driver messages leak.
- [ ] Versioning story is explicit if the API is external; internal ports stay small enough to change safely.
- [ ] Blast radius noted: who breaks if this signature changes? Keep the answer to one slice if possible.
