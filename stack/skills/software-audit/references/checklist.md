# Audit Checklist: evidence and deltas

Per-dimension evidence prompts and audit deltas, then severity, confidence, and scoring. Each `Rules:` line names the owning `software-design` reference.

Depth: each dimension is exhaustive within scope. Walk every Evidence item against every in-scope file; an item without a finding must be explicitly cleared with the evidence examined, not silently skipped.

## A. API surface / blast radius

Rules: `software-design` reference `api-surface.md`.

- Evidence: YAGNI gate per resource/field/flag/option/export (requirement, add-later cost, removal cost), including unused "future" hooks, duplicate routes, and default-expanded relations; one purpose per unit and CQS (queries that mutate, commands returning more than identity/Result); parameter count (Parameter Object only when inputs are cohesive), boolean traps, observable behavior becoming an accidental contract (Hyrum's Law), `any`/wide inputs; leaked infrastructure types (ORM entities, `Request`/`Response`, SDK DTOs, driver rows/cursors/errors) and hidden mechanisms (ordering, retries, batching, storage); lowest sufficient scope (importers checked, counterpart exported before first consumer, implementations exported instead of contracts); invariant ownership across every entry path and invalid state combinations (flags vs discriminated unions, exhaustiveness, mutable aliases); money/quantity/time-zone units, precision, and rounding; transaction boundary at the use case, partial-failure recovery (outbox/compensation only where the required consistency needs it), unit-of-work ownership in the application layer, transaction held across network calls; read-check-write races and conflict behavior; typed stable errors without stack traces or driver messages; versioning, and source/wire/storage/behavioral compatibility (error shapes, defaults, mixed-version readers/writers); callers and slices touched (blast radius).
- Deltas: trace each finding to a current consumer or contract; distinguish an internal signature change from an incompatible published contract. Apply reference exceptions; generated code/test doubles exempt.

## B. Structure

Rules: `software-design` reference `architecture-styles.md`.

- Evidence: slice boundary and inner style stated or inferable, then vertical slicing by capability (no global `controllers/`/`services/`/`models/` sprawl, no `features/` container) and one consistent inner style per module; dependency direction; cross-slice/module imports and deep imports; cross-slice communication via contracts/events only; database-shaped types shared across slices or cross-slice joins; barrel/`index.ts` files containing only re-exports (no imports, declarations, or wiring) and imports through the barrel; sharing threshold and shared-kernel size; composition-root/startup wiring and hosts; hexagonal specifics (ports named for purpose not technology, driver vs driven split, adapters per tech implementing one port, adapters never importing each other, hexagon free of framework/adapter imports, persistence ignorance, clock via param/port, test adapters); clean-architecture specifics (layers bypassed, controller calling repository, controller/presenter mixed, use cases returning view-shaped data, module extraction justified, workspace-name cross-module imports); MVVM viewmodel purity; single `infra/` tree (Périphérique); premature event bus/CQRS/service split; boundary enforcement (linter restricted imports, package `exports`, or convention).
- Deltas: establish the chosen style before reporting layer bypasses; direct repository calls are valid in flat transaction scripts. Check whether tooling can enforce a claimed boundary; do not invent layers to satisfy the checklist.

## C. SOLID / GRASP

Rules: `software-design` reference `solid-grasp.md`.

- Evidence: SRP (actor and change reasons per unit); OCP (recurring variant edits to stable files, repeated type switches); LSP (strengthened preconditions, weakened postconditions, no-op/`NotImplemented` overrides); ISP (fat interfaces, unused injected dependencies); DIP (dependency direction, inner-owned ports, composition root, seams via parameters); GRASP (Information Expert/Feature Envy, Creator, thin Controller per use case, Low Coupling/High Cohesion, Protected Variations only at demonstrated volatility (Strategy/Polymorphism for repeated type switches), Pure Fabrication/Indirection without ceremony); composition over inheritance (depth over one level, subclass needing parent internals, Replace Inheritance with Delegation candidates); the four quick checks (one purpose, variant edits, fakeable I/O, used dependencies).
- Deltas: report an observed change reason, substitution failure, unused dependency, or test obstacle, not a missing pattern. Inheritance and local exhaustive switches alone are not findings.

## D. Smells / anti-patterns

Rules: `software-design` reference `smells-antipatterns.md` and `software-design` reference `patterns.md`.

- Evidence: check each catalog smell by name and record clean or finding. Bloaters (Long Method, Large Class, Primitive Obsession, Long Parameter List, Data Clumps); OO Abusers (Switch Statements/type codes, Refused Bequest, Temporary Field, Alternative Classes with Different Interfaces); Change Preventers (Divergent Change, Shotgun Surgery, Parallel Inheritance Hierarchies); Dispensables (dead/commented-out code, obvious comments, speculative generality, duplicate knowledge, Data Class with invariant behavior elsewhere); Couplers (Feature Envy, Inappropriate Intimacy, Message Chains, Middle Man, Incomplete Library Class); architecture anti-patterns (Leaky Abstraction, God Object, Spaghetti/Lava Flow, Golden Hammer, accidental Vendor Lock-in, Premature distribution).
- Patterns (`software-design` reference `patterns.md`): for each named pattern present, confirm a present concrete pain justifies it; flag speculative or stacked patterns (Decorator+Proxy+Mediator), Singletons/global mutable instances instead of injection, patterns not removable without touching callers, and GoF implementations where framework-native features suffice. Also flag a missing pattern only when the repeated-pain gate is met (for example Builder for unreadable option bags, Adapter at SDK/driver edges, Decorator/Middleware for orthogonal behavior duplicated across units, Observer/events with mutable payloads instead of immutable past facts).
- Deltas: group by root cause and establish harm; legitimate data contracts and deliberate duplication are not automatic findings. Separate touched-code remedies from larger cleanups.

## E. Clean code

Rules: `software-design` reference `clean-code.md`.

- Evidence: laws (KISS cleverness, DRY knowledge ownership, POLA surprises, Gall/YAGNI over-building, Kernighan hard-to-debug code, Conway/unclear ownership, Boy Scout/Broken Windows small decay left in touched code); naming (intent, one verb per meaning, banned synonyms, `All` infix, boolean `is*/has*/can*`, `input`/`output` generics vs domain names, `<Fn>Input`/`<Fn>Output` boundary contracts, `on<Event>` handlers, verb-first functions/noun types, stutter, type prefixes, `Manager`/`Helper`/`Util` identifiers, scope-sized names, consistency with the slice's existing verbs); function size/nesting/guards, single-level abstraction, output args; explanatory variables, encapsulated and positive conditionals, pass-through single-use aliases; named constants for domain policy and arbitrary defaults/limits/timeouts/retry counts (with stated reason); temporal coupling and logical dependencies left implicit (ambient order, hidden initialization); comments (why not what), commented-out code; type-checker silencing (`as any`, `@ts-ignore`, `!`); redundant annotations; top-down file ordering and const use-before-define; error handling convention (Result mapping at adapters, absence vs failed I/O, preserved causes, swallowed errors, error codes mixed with values); silent domain (logging/metrics in entities or use cases); `undefined` vs `null` semantics; neutral text; public interface docs/TSDoc.
- Deltas: scope naming/style to new or edited code, neutral-text checks to introduced text.

## F. Tests / cohesion / coupling / errors

Rules: `software-design` reference `cohesion-coupling.md`, `software-design` reference `testing-refactoring.md`, and `software-design` reference `clean-code.md`.

- Evidence: cohesion (co-located handler/domain/tests/mapping, functional cohesion); sharing threshold (second consumer for a symbol, Rule of Three for a module, premature promotion or lingering duplication); coupling (cycles, globals, hidden I/O, Demeter/Tell-Don't-Ask, surprise side effects, direct call vs port vs event choice, events lacking delivery/duplicate/ordering handling, files changed per change); new third-party dependencies or ones replacing available platform features/existing dependencies (maintenance, security, size, license vs owning the code); testability (pure domain separated from I/O, explicit injection over module mocking, fakes beside ports, no DI framework solely for tests); tests (colocated, behavior through public interface, one behavior per test and scenario naming, `test.each` for overlap, boundaries and failure paths, awaited async/`resolves`/`rejects`, deterministic clocks/randomness/no sleeps, cleanup and mock/global restoration, no implementation-coupled or redundant tests, pyramid balance, adapter contract tests, weakened/deleted tests); refactor hygiene (green baseline, characterization tests, behavior fixes separate, callers updated with blast radius); error convention/boundary mapping/query purity/absence; resource ownership and cleanup on failure/cancellation, unawaited async work, timeouts, retry bounds and stacked retries, idempotency keys claimed atomically, bounded concurrency/queues/payloads, backpressure, unmeasured caches/batching and their invalidation.
- Deltas: a diff that omits test files alone does not establish a coverage gap. Before reporting one, identify a behavior contract changed by the reviewed diff; an audit-only finding about existing behavior does not make that contract changed. If no changed contract is in scope, do not report or deduct for absent coverage. For a changed contract, inspect the relevant suite to confirm its boundary or failure behavior is untested; if that evidence is unavailable, record an investigation gap rather than a finding or score deduction. Trace success, rejection, timeout/cancellation, duplicate/concurrent execution, and partial-failure paths when relevant; check final state, effect count, cleanup, and reported errors.

## G. Security

Rules: `software-design` reference `security.md` plus repo security rules.

- Evidence: boundary validation once at the edge with fail-fast actionable errors; authentication and resource/tenant authorization (missing/ambiguous authority denied, no reliance on valid IDs or UI-hidden actions); untrusted input reaching shell commands (non-parameterized exec), query syntax (non-parameterized, non-allowlisted identifiers), paths (canonical containment, symlinks, check/use races, string-prefix checks), URLs (schemes, destinations, and network trust boundary), or output encoding contexts; secrets in code/logs/errors; sensitive personal data minimization and redaction in storage/telemetry/errors; file writes scoped narrowly and destructive operations failing closed on ambiguous scope; token/permission least privilege; lockfile, dependency pinning, and unreviewed upgrades or surprise installs.
- Deltas: establish input trust and path reachability; redact secret evidence.

## Severity

Assign by demonstrated impact, after applying the owning reference's style and scope exceptions. A smell or principle name alone does not determine severity. Record the affected caller or execution path; label uncertain impact as a hypothesis to investigate.

- Blocker: a concrete path to data loss/corruption, an irreversible duplicate effect, exposed secrets, a reachable security breach, an unusable core flow, or an unapproved incompatible published contract. Architectural discomfort or a minor wrong result alone is insufficient.
- Major: reproducible incorrect behavior below the Blocker threshold, or evidenced maintainability/verification harm such as cross-slice change propagation, a violated chosen dependency boundary, an untestable changed business rule, or missing changed-behavior boundary/failure coverage.
- Minor: local clarity, naming, documentation, or duplicated ownership without demonstrated behavioral impact.

## Evidence and confidence

- Verified: a reproduction, failing test, or direct source proof establishes the consequence.
- Supported: a concrete caller/input and traced path establish the consequence, but it was not executed. State that limit.
- Unverified: a suspicion without a complete path. Report it as an investigation gap, not a confirmed finding or scoring deduction.
- Separate confidence from severity. Deduplicate findings by root cause; record both the expected contract and the observed contradiction. Do not claim repository-wide absence from a scoped search.

## Scoring

Always score every audit report, including no-findings reports and requests that do not ask for scoring. Use the in-scope A-G dimensions as criteria unless the user names others, and label the score a qualitative judgment. Score each criterion 0 (absent or conflicting), 1 (partial), or 2 (complete in the audited scope); the total is out of twice the criterion count. Tie deductions to confirmed findings and keep criteria unchanged for before/after scores. Exclude inapplicable dimensions from the denominator; if nothing can be assessed, report **Score: not assessed** with the blocker instead of inventing a numerical score.

An unresolved confirmed finding prevents full marks in its affected criterion. Unverified relevant areas make the score provisional; a full score means no identified gap within the stated scope, not universal perfection or proof from lint alone.

End the scoring report with **Total score: ?/10**, replacing `?` with the criterion total divided by the maximum possible total and multiplied by 10; mark it provisional when applicable.
