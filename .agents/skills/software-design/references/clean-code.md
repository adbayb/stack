# Clean Code + Naming

## Laws that shape code

- **KISS:** simplest design that meets the requirement. Delete cleverness.
- **YAGNI / Hyrum's Law:** apply the public-surface gate in `api-surface.md`.
- **DRY:** one authoritative representation per piece of knowledge. Deduplicate rules, not coincidental text; use `cohesion-coupling.md` for extraction thresholds.
- **Law of Demeter:** use the collaborator rules in `cohesion-coupling.md`.
- **POLA:** behave as a reasonable reader expects.
- **Boy Scout Rule / Broken Windows:** leave code cleaner than found; repair small decay immediately.
- **Gall's Law:** working complex systems evolve from working simple ones. Ship simple, iterate.
- **Conway-aware:** module boundaries should match how the team works; unclear ownership creates coupling.
- **Kernighan's Law:** debugging is twice as hard as writing. Keep writing simple enough to debug.

## Code rules

- Names reveal intent: `refundOverdueOrders(clock, repo)` beats `process(data, 1)`. No abbreviations, no `tmp`/`data2`, no misleading names (`getAll` that is actually a map).
- Functions are small, single-level, single-purpose. Prefer guard clauses and shallow nesting; deeper nesting is a signal to check for mixed responsibilities or hard-to-follow control flow. For new or substantially edited functions approaching 20 lines, check whether extraction improves cohesion and readability; line count alone is not a reason to add indirection. Leave unrelated existing functions for a scoped refactor.
- Use `api-surface.md` for command/query separation. No output args. Name literals that encode domain policy or recur with the same meaning; leave self-explanatory structural literals inline.
- Match the surrounding annotation style: skip annotations that only repeat an inferred type, but keep explicit types where the file or exported contract already uses them; annotate when a stricter type than inferred is wanted (e.g. an enum instead of `string`).
- Order files top-down: public-facing interface and high-level policy before implementation details; describe/test cases before helpers in test files. Do not call a `const` helper at module load before it is defined.
- Comments explain why, never what. Delete commented-out code and obvious narration. Code should read without them.
- Error handling is explicit: use the project's established convention. In Result-based code, represent expected failures as Results and map foreign exceptions at adapters; do not introduce a Result library or migrate throw-based code for this rule. Distinguish expected absence from failed I/O; never turn a failed lookup into an empty result. Preserve error causes for boundary reporting, without leaking infrastructure or secrets. Hosts map failures to responses and logs; do not swallow errors or mix error codes with successful values.
- Silent domain: no logging or metrics in entities or use cases. Observability lives in adapters/hosts (middleware/decorators); the domain signals through typed errors and return values.
- Name the middle steps: break complex expressions into explanatory variables and encapsulate boolean conditions (`if (isEligibleForRefund)` beats an inline predicate). Prefer positive conditionals; no double negatives (`isEnabled`, not `isNotDisabled`).
- Every name must earn its place: a single-use const is justified only if it adds meaning, binds an await, narrows a type, or centralizes a literal; pure pass-through aliases get inlined.
- No hidden temporal coupling: never require callers to invoke methods in a specific order. Make the sequence unrepresentable (single entry point, builder, or explicit state) or pass the prerequisite as a parameter.
- Make logical dependencies physical: if one unit needs another, say so with an import, parameter, or injection. No action at a distance, no reliance on ambient execution or initialization order.
- Don't be arbitrary: every default, limit, timeout, and retry count is a named constant with a stated reason, at the top of its module or the composition root. Never a bare literal buried in logic.
- Don't silence the type checker: no `as any`, `@ts-ignore`/`@ts-expect-error`, or non-null `!` to make an error go away. If unavoidable, narrow to the smallest scope and add a why-comment.
- Scope-sized names: long descriptive names for wide scopes, short ones only for tiny scopes (loop counters). No type prefixes or encodings (`strName`, `iCount`); no `Manager`/`Helper`/`Util` grab-bag classes or functions. File/module names may describe shared infrastructure (for example `helpers.ts`); the ban applies to class and function identifiers.
- Prefer `undefined` for optional internal values in new code; preserve `null` where a platform, schema, protocol, or established public contract assigns it meaning. Distinguish missing, empty, and explicit clearing when the contract needs them.
- Public/exported production APIs carry a TSDoc (`/** */`) stating the contract (what it promises, including edge behavior; `@param`/`@returns` only when the description adds info beyond the types). Internal production helpers may omit it; non-obvious test helpers may keep a short contract comment.
- Formatting is automated and non-negotiable; diffs stay focused.
- Generated text stays neutral: never emit em dashes (`—`, U+2014), decorative en-dashes/double-hyphens, or invisible unicode (U+00A0, U+200B-U+200D, stray U+FEFF). Restructure the sentence or use plain ASCII equivalents (hyphen, regular space) instead.
- Curly quotes and the ellipsis glyph (`…`, U+2026) are fine in prose but forbidden in code, comments, and copy-pasteable samples. Avoid other decorative non-ASCII punctuation.

## Naming convention: one verb, one meaning

Pick one verb per contract and use it everywhere. Same verb must always mean the same thing (POLA); synonyms force readers to guess whether `fetch` differs from `get`.

- **Queries (no mutation):** `get` (lookup by identity), `find` (search by criteria/filter), `exists` / `count`. Missing values use the absence convention above; failures use the project's error convention. Use `getOrThrow` only for an explicit missing-value exception contract; an I/O failure alone does not require renaming a query. Collections use a plural noun, never an `All` infix (`getOrders`, `findOverdueOrders`, not `getAllOrders`).
- **Commands (side effects):** `create`, `update`, `remove` for plain lifecycle; rich domain behavior uses intention verbs (`refundOrder`, `activateAccount`) instead of `setStatus` / `updateFlag`.
- **Banned synonyms:** `fetch` / `retrieve` / `load` / `read` / `list` -> `get`, `query` (as verb) -> `find` / `exists`, `delete` / `clear` -> `remove`, `add` / `insert` / `save` -> `create` / `update`, `set` -> an intention verb (`refundOrder`, not `setStatus`; plain `set` only for dumb holders/builders/DTOs and React state setters), `process` / `handle` / `manage` / `do` -> the specific intention verb, `data` / `info` / `util` -> a domain noun (`Order`, `RefundPolicy`). Third-party and platform APIs (e.g. `fetch`) keep their own names.
- **Booleans:** `is*`, `has*`, `can*` (`isOverdue`, `hasAccess`, `canRefund`).
- **Generic utilities:** parameters with no domain meaning use `input` (`...inputs` for rest) and results use `output`, instead of `data`/`arg`/`val`/`x`. A parameter with domain meaning always takes the domain name (`userId`, not `input`); destructured properties and task keys keep distinct domain names.
- **Boundary contracts:** when a function's input/output shape exists nowhere else (bespoke aggregation at a boundary, also serving as the Parameter Object), name it `<FunctionName>Input` / `<FunctionName>Output` (PascalCase of the verb-first function: `createMessage` takes `CreateMessageInput`). Reuse domain types directly otherwise: never alias a domain entity per function, never wrap a single existing value.
- **Events/handlers:** `on<Event>` (`onOrderPlaced`).
- **Shape:** functions are verb-first (`findOverdueOrders`), classes/types are nouns (`OrderRefunder`), no stutter (`orderRepo.getOrder` -> `orders.get(id)` or `getOrderById`: pick once per codebase and stay consistent).
- **Consistency rule:** when touching a file, align new names with the verbs already used in that slice; never introduce a second synonym for an existing contract. Apply to new and edited code; don't rename existing exported symbols just for this rule.
