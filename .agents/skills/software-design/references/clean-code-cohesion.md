# Clean Code + Cohesion / Coupling

Based on https://gist.github.com/cedrickchee/55ecfbaac643bf0c24da6874bf4feb08, cohesion/coupling topics, and Laws of Software Engineering. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## Curated laws that shape code

- **KISS:** simplest design that meets the requirement. Delete cleverness.
- **YAGNI:** no functionality until necessary.
- **DRY:** one authoritative representation per piece of knowledge. Deduplicate rules, not coincidental text.
- **Law of Demeter:** only talk to immediate friends. Inject collaborators; no train wrecks.
- **Principle of Least Astonishment:** behave as a reasonable reader expects.
- **Boy Scout Rule / Broken Windows:** leave code cleaner than found; repair small decay immediately.
- **Gall's Law:** working complex systems evolve from working simple ones: ship simple, iterate.
- **Hyrum's Law:** every observable behavior becomes a dependency: keep surfaces small.
- **Conway-aware:** module boundaries should match how the team actually works; unclear ownership creates coupling.
- **Kernighan's Law:** debugging is twice as hard as writing: keep writing simple enough to debug.
- **Testing Pyramid:** many fast unit tests on pure domain, fewer integration tests at adapters, minimal end-to-end.

## Clean-code rules

- Names reveal intent: `refundOverdueOrders(clock, repo)` beats `process(data, 1)`. No abbreviations, no `tmp`/`data2`, no misleading names (`getAll` that is actually a map).
- Functions are small, single-level, single-purpose. Guard clauses first; max one or two nesting levels. Extract Method on sight of 20+ line functions.
- No side effects in queries; no output args; no magic numbers/strings: Replace Magic Number with Symbolic Constant.
- Skip explicit return/output types when TypeScript can infer them; annotate only when a stricter type than inferred is wanted (e.g. an enum instead of `string`) or when an exported API contract should be explicit.
- Code organization: public-facing interface first. Put exports before implementation details in source files, and describe/test cases before helpers in test files. Helpers may sit below the exports, as long as nothing calls a `const` helper at module load before it is defined.
- Comments explain why, never what. Delete commented-out code and obvious narration. Code should read without them.
- Error handling is explicit: prefer returning success or failure with Result objects from `@open-vanilla/result` over throwing for normal control flow. Exceptions cannot be avoided for code we do not control: catch them at the boundary and map them to a failed Result, so they never leak into the domain. Expected absence stays `undefined`/empty (queries never throw; a throwing lookup needs its own intention verb such as `getOrThrow`, reserved for interop with throw-based APIs). No swallowed exceptions, no error-code returns mixed with values; hosts map failed Results to responses and logs. Apply to new and edited code; don't migrate existing throw-based code just for this.
- Silent domain: no logging or metrics in entities or use cases: observability lives in adapters/hosts (middleware/decorators); the domain signals via typed errors and return values only. Never log secrets or credentials.
- Secure by default: validate once at the boundary (see `api-surface.md`); never interpolate untrusted input into shell commands: use parameterized exec helpers; keep file writes scoped to the narrowest path set (destructive ops fail closed on ambiguous scope); least privilege for tokens and permissions.
- Name the middle steps: break complex expressions into explanatory variables and encapsulate boolean conditions (`if (isEligibleForRefund)` beats an inline predicate). Prefer positive conditionals; no double negatives (`isEnabled`, not `isNotDisabled`).
- Every name must earn its place: a single-use const is justified only if it adds meaning, binds an await, narrows a type, or centralizes a literal; pure pass-through aliases get inlined.
- No hidden temporal coupling: never require callers to invoke methods in a specific order. Make the sequence unrepresentable (single entry point, builder, or explicit state) or pass the prerequisite as a parameter.
- Make logical dependencies physical: if one unit needs another, say so with an import, parameter, or injection. No action at a distance, no reliance on ambient execution or initialization order.
- Don't be arbitrary: every default, limit, timeout, and retry count is a named constant with a stated reason, placed at the top of its module or the composition root. Never a bare literal buried in logic.
- Don't silence the type checker: no `as any`, `@ts-ignore`/`@ts-expect-error`, or non-null `!` to make an error go away. If unavoidable, narrow to the smallest scope and add a why-comment.
- Scope-sized names: long descriptive names for wide scopes, short ones only for tiny scopes (loop counters). No type prefixes or encodings (`strName`, `iCount`); no `Manager`/`Helper`/`Util` holders. Give the responsibility a domain name.
- Absence is `undefined`, never `null`, in new code.
- Public/exported APIs carry a one-line TSDoc (`/** */`) stating the contract (what it promises, including edge behavior; `@param`/`@returns` only when the description adds info beyond the types); internals carry none.
- Order files top-down: callers above callees, high-level policy before low-level detail.
- Formatting is automated and non-negotiable; diffs stay focused. Generated text stays neutral: never emit em-dashes (`—`, U+2014), decorative en-dashes/double-hyphens, or invisible unicode (U+00A0, U+200B-U+200D, stray U+FEFF). Restructure the sentence or use plain ASCII equivalents (hyphen, regular space) instead. Curly quotes and the ellipsis glyph (`…`, U+2026) are fine in prose but forbidden in code, comments, and copy-pasteable samples. Avoid other decorative non-ASCII punctuation.

## Naming convention: one verb, one meaning

Pick one verb per contract and use it everywhere. Same verb must always mean the same thing (POLA); synonyms force readers to guess whether `fetch` differs from `get`.

- **Queries (no side effects):** `get` (lookup by identity, never throw: `undefined`/empty when missing), `find` (search by criteria/filter, `undefined`/empty when nothing matches), `exists` / `count`. A throwing lookup needs its own intention verb (e.g. `getOrThrow`). Collections are expressed by a plural noun, never an `All` infix (`getOrders`, `findOverdueOrders`, not `getAllOrders`).
- **Commands (side effects):** `create`, `update`, `remove` for plain lifecycle; rich domain behavior uses intention verbs (`refundOrder`, `activateAccount`) instead of `setStatus` / `updateFlag`.
- **Banned synonyms (use the alternative instead):** `fetch` / `retrieve` / `load` / `read` → `get`, `query` (as verb) → `find` / `exists`, `delete` / `clear` → `remove`, `add` / `insert` / `save` → `create` / `update`, `set` → an intention verb (`refundOrder`, not `setStatus`; plain `set` only for dumb holders/builders/DTOs and React state setters), `process` / `handle` / `manage` / `do` → the specific intention verb describing what it actually does, `data` / `info` / `util` → a domain noun (`Order`, `RefundPolicy`). Third-party and platform APIs (e.g. `fetch`) keep their own names.
- **Booleans:** `is*`, `has*`, `can*` (`isOverdue`, `hasAccess`, `canRefund`).
- **Generic utilities:** parameters with no domain meaning use `input` (`...inputs` for rest) and results use `output`, instead of `data`/`arg`/`val`/`x`. A parameter with domain meaning always takes the domain name (`userId`, not `input`); destructured properties and task keys keep distinct domain names.
- **Boundary contracts:** when a function's input/output shape exists nowhere else (bespoke aggregation at a boundary, also serving as the Parameter Object), name it `<FunctionName>Input` / `<FunctionName>Output` (PascalCase of the verb-first function: `createMessage` takes `CreateMessageInput`). Reuse domain types directly otherwise: never alias a domain entity per function, never wrap a single existing value.
- **Events/handlers:** `on<Event>` (`onOrderPlaced`).
- **Shape:** functions are verb-first (`findOverdueOrders`), classes/types are nouns (`OrderRefunder`), no stutter (`orderRepo.getOrder` → `orders.get(id)` or `getOrderById`: pick once per codebase and stay consistent).
- **Consistency rule:** when touching a file, align new names with the verbs already used in that slice; never introduce a second synonym for an existing contract. Apply to new and edited code; don't rename existing exported symbols just for this rule.

## Cohesion (things that change together live together)

- Functional cohesion per module: all elements serve the single stated purpose.
- Co-locate: handler + hexagon/domain + tests + mapping for one use case in one folder.
- Shared code earns its place: used by 3+ slices with one owner, versioned, and free of slice-specific branches.

## Coupling (minimize)

- Prefer, in order: message/event → explicit interface param → injected port → direct import of shared kernel. Never: global mutable state, deep relative imports across slices/modules, cross-slice table joins in code.
- Tell-Don't-Ask: pass intent (`refund(orderId)`), do not pull entrails (`order.getCustomer().getWallet().debit()`).
- Stable dependencies only: depend in the direction of stability; volatile details hide behind ports. Keep dependencies between modules/slices/packages narrow, intentional, and pointing toward more stable, lower-level code. No cycles.
- Measure informally: "If I change X, how many files must change?" One is ideal; more than three signals Shotgun Surgery or Inappropriate Intimacy.
