# Clean Code + Cohesion / Coupling

Based on https://gist.github.com/cedrickchee/55ecfbaac643bf0c24da6874bf4feb08, cohesion/coupling topics, and Laws of Software Engineering. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## Curated laws that shape code

- **KISS:** simplest design that meets the requirement. Delete cleverness.
- **YAGNI:** no functionality until necessary.
- **DRY:** one authoritative representation per piece of knowledge. Deduplicate rules, not coincidental text.
- **Law of Demeter:** only talk to immediate friends. Inject collaborators; no train wrecks.
- **Principle of Least Astonishment:** behave as a reasonable reader expects.
- **Boy Scout Rule / Broken Windows:** leave code cleaner than found; repair small decay immediately.
- **Gall's Law:** working complex systems evolve from working simple ones — ship simple, iterate.
- **Hyrum's Law:** every observable behavior becomes a dependency — keep surfaces small.
- **Conway-aware:** module boundaries should match how the team actually works; unclear ownership creates coupling.
- **Kernighan's Law:** debugging is twice as hard as writing — keep writing simple enough to debug.
- **Testing Pyramid:** many fast unit tests on pure domain, fewer integration tests at adapters, minimal end-to-end.

## Clean-code rules

- Names reveal intent: `refundOverdueOrders(clock, repo)` beats `process(data, 1)`. No abbreviations, no `tmp`/`data2`, no misleading names (`getAll` that is actually a map).
- Functions are small, single-level, single-purpose. Guard clauses first; max one or two nesting levels. Extract Method on sight of 20+ line functions.
- No side effects in queries; no output args; no magic numbers/strings — Replace Magic Number with Symbolic Constant.
- Skip explicit return/output types when TypeScript can infer them; annotate only when a stricter type than inferred is wanted (e.g. an enum instead of `string`).
- Comments explain why, never what. Delete commented-out code and obvious narration. Code should read without them.
- Error handling is explicit: typed errors at boundaries — throw for exceptional paths, `undefined`/empty for expected absence (queries never throw) — no swallowed exceptions, no error-code returns mixed with values; adapters/hosts map errors to responses and logs.
- Silent domain: no logging or metrics in entities or use cases — observability lives in adapters/hosts (middleware/decorators); the domain signals via typed errors and return values only.
- Formatting is automated and non-negotiable; diffs stay focused.

## Naming convention — one verb, one meaning

Pick one verb per contract and use it everywhere. Same verb must always mean the same thing (POLA); synonyms force readers to guess whether `fetch` differs from `get`.

- **Queries (no side effects):** `get` (one item by identity), `getAll` (collection, with optional filters/pagination), `find` / `findAll` (search, optional/filtered — absent → `undefined` / empty collection), `exists` / `count` (boolean / number).
- **Commands (side effects):** `create`, `update`, `remove` for plain lifecycle; rich domain behavior uses intention verbs (`refundOrder`, `activateAccount`) instead of `setStatus` / `updateFlag`.
- **Banned synonyms (use the alternative instead):** `fetch` / `retrieve` / `load` / `read` → `get` (single) / `getAll` (collection), `query` (as verb) → `find` / `findAll` / `exists`, `list` → `findAll`, `delete` / `clear` → `remove`, `add` / `insert` / `save` → `create` / `update`, `set` → an intention verb (`refundOrder`, not `setStatus`; plain `set` only for dumb holders/builders/DTOs), `process` / `handle` / `manage` / `do` → the specific intention verb describing what it actually does, `data` / `info` / `util` → a domain noun (`Order`, `RefundPolicy`).
- **Booleans:** `is*`, `has*`, `can*` (`isOverdue`, `hasAccess`, `canRefund`).
- **Events/handlers:** `on<Event>` (`onOrderPlaced`).
- **Shape:** functions are verb-first (`findAllOverdueOrders`), classes/types are nouns (`OrderRefunder`), no stutter (`orderRepo.getOrder` → `orders.get(id)` or `getOrderById` — pick once per codebase and stay consistent).
- **Consistency rule:** when touching a file, align new names with the verbs already used in that slice; never introduce a second synonym for an existing contract.

## Cohesion (things that change together live together)

- Functional cohesion per module: all elements serve the single stated purpose.
- Co-locate: handler + hexagon/domain + tests + mapping for one use case in one folder.
- Shared code earns its place: used by 3+ slices with one owner, versioned, and free of slice-specific branches.

## Coupling (minimize)

- Prefer, in order: message/event → explicit interface param → injected port → direct import of shared kernel. Never: global mutable state, deep relative imports across slices/modules, cross-slice table joins in code.
- Tell-Don't-Ask: pass intent (`refund(orderId)`), do not pull entrails (`order.getCustomer().getWallet().debit()`).
- Stable dependencies only: depend in the direction of stability; volatile details hide behind ports.
- Measure informally: "If I change X, how many files must change?" One is ideal; more than three signals Shotgun Surgery or Inappropriate Intimacy.
