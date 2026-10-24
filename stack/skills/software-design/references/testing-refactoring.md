# Testing + Refactoring

## Testability

- Separate pure domain logic from I/O: unit-test without mocks of databases, clocks, or network.
- Prefer real collaborators when fast, deterministic, and safe; otherwise inject small fakes or stubs at I/O boundaries (clock, ID generator, repository, HTTP client).
- Prefer explicit dependency injection over module interception or global mocking. Function parameters often suffice; do not add a DI framework, interfaces, or layers solely for tests. Retain mocks for legacy or platform boundaries where an injection seam would require disproportionate changes.
- Colocate tests with source (`*.test.ts` next to implementation); fakes live beside the ports they implement.
- Test behavior through the public interface and keep the suite lean. Assert observable results and effects; verify interaction order or call counts only when they are part of the contract, not incidental implementation details.

## Tests

- Use the project's existing test runner and conventions; do not introduce or replace tooling just to add tests.
- Await asynchronous operations and assertions, or return their promises to the runner. With Vitest, await or return `expect(...).resolves` and `expect(...).rejects`.
- Every test earns its place: it covers a behavior, a boundary, or a failure path through the public interface. No coverage fillers, no assertions on implementation details.
- One behavior per test, named by scenario and expectation (`refund fails when the order is already refunded`).
- Consolidate overlapping cases with `test.each` (or the language's table-driven equivalent) when they share setup and assertions; keep distinct scenarios separate.
- Cover boundaries and failure paths, not only the happy path: empty or missing input, limits, rejected states, adapter errors mapped at the boundary.
- Remove redundant, obsolete, or implementation-coupled tests in files you touch.
- Follow `FIRST` and the Testing Pyramid: many fast unit tests on pure domain, fewer integration tests at adapters, minimal end-to-end.
- Never weaken or delete a failing test, or suppress a check, to make a fix pass. A test encoding wrong behavior changes only in the behavior-fix lane below, with the previous contract recorded.
- Keep tests deterministic: control clocks/randomness, isolate state, and synchronize asynchronous work by observable events instead of sleeps. Clean up resources and restore mocks, globals, timers, and working-directory changes even after assertions fail; with Vitest, use cleanup hooks and the appropriate `vi` restoration APIs.
- Verify adapter contracts with focused integration tests where fakes could hide query, serialization, transaction, or external error semantics; mock-only tests do not prove an adapter works.
- For changed concurrent or retried behavior, exercise the relevant conflict, duplicate, timeout/cancellation, and partial-failure cases. Assert the final state and effect count; use controlled scheduling rather than probabilistic timing.

## Refactoring

- Refactor only from a green baseline. If tests fail before you start, record the failure; do not attribute it to the refactor.
- Refactor in behavior-preserving steps. Add or adjust tests that lock the current behavior before restructuring; use characterization tests when none exist.
- Keep behavior fixes separate from refactors: reproduce the bug with a failing test, fix the behavior, then refactor under the locked tests.
- Keep public contracts stable during refactors. When a signature must change, update every caller in the same change and state the blast radius.
