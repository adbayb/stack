# Architecture Styles — slice first, layer second

Slice first, layer second. A slice is one business feature cut vertically through the layers, owning its handler, domain/hexagon, adapters, tests. Vertical slicing is mandatory for any application kind; splitting by modules is optional and fits bigger applications — clean-architecture candidates with heavy business rules — to enforce cohesion and minimize coupling between modules. Hexagonal/Clean Architecture/MVVM = how you organize the inside, chosen once per module (or per application when there are no modules) and kept consistent across its slices. Acronyms are expanded once in the `software-design` SKILL.md glossary.

The architecture within a module stays consistent across its slices. By its standalone nature, a module enables local decisions: module A with little logic may use MVC or transaction scripts while module B with extensive rules uses a layered architecture (Clean or Hexagonal architecture).

## Vertical slice (default)

- Structure by capability: one folder per feature under `src/` (e.g. `src/refund/`), named with a noun, owning its handler, domain/hexagon, adapters, tests — no `features/` container; the extra level adds nothing. (In a clean module, features take the use-case verb form instead — see Clean Architecture essentials.)
- Cross-slice communication only via explicit contracts or domain events. No deep imports (`../../other-slice/internals`).
- Each folder exposes its public surface through `index.ts`; import via the barrel, never deep into another folder's internals.
- Shared kernel holds only truly shared code and stays tiny; everything else is duplicated deliberately until the Rule of Three proves shared.

## Inside a slice

| Situation                                                                            | Inner style                  | Layout hint                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Same logic through swappable adapters/techs or contexts; hexagon tested in isolation | Hexagonal (ports & adapters) | `hexagon/<use-case>.ts`, `hexagon/ports/driver\|driven/<port-name>.ts`, `adapters/<tech>/<port-name>.ts`, `startup/<tech>.ts` |
| Business logic built on enterprise rules shared across apps/modules                  | Clean architecture           | `entities/`, `useCases/`, `adapters/`, `frameworks/` pointing inward                                                          |
| UI-driven with rich view state, thin domain logic                                    | MVVM / MVP                   | `view`, `viewmodel` (no I/O), `model`/ports for data                                                                          |
| Single script, CRUD, glue (transaction script)                                       | Flat modular                 | one slice + tests; no ports ceremony                                                                                          |

Dependency rule is absolute: inward only. Inner layers know nothing of outer layers. Adapters implement ports the inner layers own.

## Hexagonal essentials

Follows https://jmgarridopaz.github.io/content/hexagonalarchitecture-ig/intro.html (faithful to Cockburn).

- Goal: drivers drive the hexagon in isolation from real devices; test cases are the first drivers — the hexagon is done when it passes with test doubles, real adapters come after.
- Ports are named for purpose (`ForParkingCars`, `ForObtainingRates`), not technology; each port publishes its interface + DTOs, implementation stays hidden. Split by side: driver (called by adapters) vs driven (implemented by adapters).
- Hexagon = business logic implementing driver ports and depending on driven ports (constructor-injected). Inner organization is orthogonal — single class or app/domain split, your choice.
- Adapters grouped by tech (`adapters/<tech>/<port-name>.ts`, tech e.g. `http`, `web`, `cli`, `file`, `postgres`, `stripe`): minimum two per port — default test adapter (driver: test harness; driven: stub/fake/mock) + real adapter; swappable, one port and one role each (SRP), no cross-adapter imports.
- Startup: one entry per driver technology (`startup/<tech>.ts`, e.g. `http.ts`, `cli.ts`, or host per driver); it depends on hexagon + adapters (hexagon depends on nothing; each adapter depends on hexagon + its tech). Per entry: 1. instantiate driven adapters, 2. instantiate hexagon injecting driven ports, 3. instantiate driver adapter with driver port, 4. run it. Test entries wire doubles, production entries wire real adapters.
- Configurable Dependency both sides (triggerer knows dependency: driver adapter → driver port; hexagon → driven port). Domain never imports infrastructure.
- Persistence Ignorance: entities do not extend ORM base classes, carry decorators, or know table names. Clock passed as param or via driven port for testability.

## Clean Architecture essentials

Follows the reference implementation at https://github.com/adbayb/clean-architecture.

- Split by module: one module per bounded context (`modules/<context>/`) owning everything from presentation to data — modules are decision-autonomous, so only business-heavy modules pay for these layers.
- Top-level entries inside a module are business features AND shared entities side by side (`modules/catalog/src/` holds `GetProducts/` next to `Product/`); second-level directories are the layers, so the dependency rule is materialized in the folder tree.
- Each module is a workspace package (`modules/<context>/package.json`): boundaries are enforced by the package manager — cross-module imports only via workspace package names, never deep relative imports — and build/test run per module.
- Extract a new module when language diverges (same word, different meaning), change cadence splits, or team ownership demands it — never for a single team shipping one deploy with one language; that's slices, not modules.
- Layers, inward only: `entities/` (enterprise business rules) → `useCases/` (application business rules) → `adapters/` (interface adapters: gateways, presenters) → `frameworks/` (views, data sources, DB clients). Outer layers know the inner ones, never the reverse.
- Shared Kernel (`modules/shared/`) is a shared module holding shareable entities coupled to gateways — not a dumping ground.
- Shared entities live as siblings of features directly under `src/`, never in a `shared/` folder and never imported feature-to-feature. A shared entity is a full vertical unit, not just a domain class: it embeds all its layers including gateway implementations (`Product/` carries `entities/` + `adapters/` + `frameworks/`, only `useCases/` missing since entities have no use case). Features take the use-case verb form (`GetProducts`), shared entities the noun form (`Product`). Depend on a shared entity only through its ports.
- Promote sharing stepwise: tolerate duplication → extract to a sibling shared entity at the Rule of Three → promote to the cross-module Shared Kernel only when another module needs it.
- `hosts/` is the outermost layer: one main component per driver (web UI, CLI, back-end server) instantiating the inner layers (composition root) and serving as system entry point. It is not depicted in the classic Clean Architecture diagram.
- Never bypass: a web controller must not call a database repository directly — every call crosses a use case (port), otherwise the layers are decoration.
- Presenters: prefer push-based — the controller hands output to the presenter through the application layer; the use case never returns view-shaped data for the controller to format. Never mix controller and presenter in one class, so new output formats (web, CLI, JSON) plug in later.

## MVVM essentials

- `view` / `viewmodel` (no I/O or side effects) / `model` plus ports for data. For UI-driven slices with rich view state and thin domain logic: keep state transitions in the viewmodel, fetch through ports, stay testable without rendering.

## Flat modular essentials

Follows https://martinfowler.com/eaaCatalog/transactionScript.html: one procedure per presentation request, calling the database directly or through a thin wrapper; shared subtasks extracted as subprocedures.

- One folder + tests, no ports ceremony; plain MVC also fine while the slice stays simple. Extract use cases or layers when rules grow (Gall's Law). Tests execute the folder directly, stubbing I/O at its edges.

## What not to do

- Do not rely on convention alone for boundaries — encode the dependency rule, module boundaries, and barrel entry points in the linter (restricted imports) and in workspace `package.json` `exports`, so violations fail the check instead of slipping through review.
- Do not lump all infrastructure in one tree (`infra/` with web controllers next to database repositories) — it lets outer layers call each other around the domain (Périphérique antipattern). Split infrastructure per adapter and keep every crossing behind a port.
- Do not create global `controllers/`, `services/`, `models/` layers for a sliced system — that is horizontal sprawl with high coupling.
- Do not share a database-shaped type across slices. Map at each boundary.
- Do not add event bus, CQRS, or microservice split until a slice outgrows in-process calls (Gall's Law: evolve from a working simple system).
