# Architecture Styles: slice first, layer second

A slice is one business feature cut vertically through the layers, owning its handler, domain/hexagon, adapters, and tests. Vertical slicing is mandatory. Modules are optional: use them for larger applications with heavy rules, where they enforce cohesion and minimize coupling. Choose one inner style per module (or app) and keep it consistent; a module may choose locally (e.g. MVC/flat for light logic, Clean/Hexagonal for heavy rules).

## Vertical slice (default)

- Structure by capability: one folder per feature under `src/` (e.g. `src/refund/`), named with a noun, owning its handler, domain/hexagon, adapters, and tests. No `features/` container; the extra level adds nothing.
  In a clean module, features take the use-case verb form instead: see Clean Architecture essentials.
- Cross-slice communication only via explicit contracts or domain events. No deep imports (`../../other-slice/internals`).
- Hexagonal/clean modules expose each folder's public surface through `index.ts`; any file serving as a barrel, including a package entrypoint, contains only re-export declarations, including type-only re-exports, with no imports, local declarations, or executable implementation. Keep startup and wiring in runtime entrypoints or composition roots, not in barrels. Import via the barrel, never deep into another folder's internals. Flat/MVVM slices may import directly within the slice, but never deep-import another slice's internals.
- Shared kernel holds only truly shared code and stays tiny; everything else is duplicated deliberately until the sharing threshold (`cohesion-coupling.md`) proves shared.

## Inside a slice

| Situation                                                                            | Inner style                  | Layout hint                                                                                                                   |
| ------------------------------------------------------------------------------------ | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Same logic through swappable adapters/techs or contexts; hexagon tested in isolation | Hexagonal (ports & adapters) | `hexagon/<use-case>.ts`, `hexagon/ports/driver\|driven/<port-name>.ts`, `adapters/<tech>/<port-name>.ts`, `startup/<tech>.ts` |
| Business logic built on enterprise rules shared across apps/modules                  | Clean architecture           | `entities/`, `useCases/`, `adapters/`, `frameworks/` pointing inward                                                          |
| UI-driven with rich view state, thin domain logic                                    | MVVM / MVP                   | `view`, `viewmodel` (no I/O), `model`/ports for data                                                                          |
| Single script, CRUD, glue (transaction script)                                       | Flat modular                 | one slice + tests; no ports ceremony                                                                                          |

In layered styles, dependencies point inward: inner layers know nothing of outer layers, and adapters implement inner-owned ports. Flat slices need no artificial layers; keep their I/O explicit and testable.

## Hexagonal essentials

Follows https://jmgarridopaz.github.io/content/hexagonalarchitecture-ig/intro.html (faithful to Cockburn).

- Goal: drivers drive the hexagon in isolation from real devices; test cases are the first drivers: the hexagon is done when it passes with test doubles, real adapters come after.
- Ports are named for purpose (`ForParkingCars`, `ForObtainingRates`), not technology; each port publishes its interface + DTOs, implementation stays hidden. Split by side: driver (called by adapters) vs driven (implemented by adapters).
- Hexagon = business logic implementing driver ports and depending on driven ports (constructor-injected). Inner organization is orthogonal: single class or app/domain split, your choice.
- Adapters are grouped by tech (`adapters/<tech>/<port-name>.ts`; tech such as `http`, `web`, `cli`, `file`, `postgres`, or `stripe`). Provide at least two per port: a default test adapter (driver: test harness; driven: stub/fake/mock) and a real adapter. Adapters are swappable, implement one port and one role each (SRP), and never import each other.
- Startup: one entry per driver technology (`startup/<tech>.ts`, e.g. `http.ts`, `cli.ts`, or host per driver); it depends on hexagon + adapters (hexagon has no adapter/framework dependencies; each adapter depends on hexagon + its tech).
  Per entry: 1. instantiate driven adapters, 2. instantiate hexagon injecting driven ports, 3. instantiate driver adapter with driver port, 4. run it. Test entries wire doubles, production entries wire real adapters.
- Configurable Dependency both sides (triggerer knows dependency: driver adapter -> driver port; hexagon -> driven port). Domain never imports infrastructure.
- Persistence Ignorance: entities do not extend ORM base classes, carry decorators, or know table names. Clock passed as param or via driven port for testability.

## Clean Architecture essentials

Follows the reference implementation at https://github.com/adbayb/clean-architecture.

- Split by module: one module per bounded context (`modules/<context>/`) owns everything from presentation to data. Modules are decision-autonomous, so only business-heavy modules pay for these layers.
- Top-level entries inside a module are business features and shared entities side by side (`modules/catalog/src/` holds `GetProducts/` next to `Product/`); second-level directories are the layers, so the dependency rule is materialized in the folder tree.
- Each module is a workspace package (`modules/<context>/package.json`). Cross-module imports use workspace package names only, never deep relative imports; build/test run per module. Enforce boundaries as below: package membership alone does not prevent forbidden imports.
- Extract a new module when language diverges (same word, different meaning), change cadence splits, or team ownership demands it. Never do it for a single team shipping one deploy with one language; that is slices, not modules.
- Layers, inward only: `frameworks/` (views, data sources, DB clients) -> `adapters/` (gateways, presenters) -> `useCases/` (application business rules) -> `entities/` (enterprise business rules). Runtime calls may point outward through inner-owned ports; source imports must not.
- Shared Kernel (`modules/shared/`) is a shared module holding shareable entities coupled to gateways: not a dumping ground.
- Shared entities live as siblings of features directly under `src/`, never in a `shared/` folder and never imported feature-to-feature.
  A shared entity is a full vertical unit, not just a domain class: it embeds all its layers including gateway implementations (`Product/` carries `entities/` + `adapters/` + `frameworks/`, only `useCases/` missing since entities have no use case).
  Features take the use-case verb form (`GetProducts`), shared entities the noun form (`Product`). Depend on a shared entity only through its ports.
- Promoted code moves to a sibling shared entity, then to the cross-module Shared Kernel; `cohesion-coupling.md` owns when to promote.
- `hosts/` is the outermost layer: one main component per driver (web UI, CLI, back-end server) instantiating the inner layers (composition root) and serving as system entry point. It is not depicted in the classic Clean Architecture diagram.
- Never bypass the layers: a web controller must not call a database repository directly. Every call crosses a use case (port); otherwise the layers are decoration.
- Prefer push-based presenters: the controller hands output to the presenter through the application layer; the use case never returns view-shaped data for the controller to format. Never mix controller and presenter in one class, so new output formats (web, CLI, JSON) plug in later.

## MVVM essentials

- `view` / `viewmodel` (no I/O or side effects) / `model` plus ports for data. For UI-driven slices with rich view state and thin domain logic: keep state transitions in the viewmodel, fetch through ports, stay testable without rendering.

## Flat modular essentials

Follows the transaction-script pattern (https://martinfowler.com/eaaCatalog/transactionScript.html): one procedure per presentation request calls the database directly or through a thin wrapper; extract shared subtasks as subprocedures.

- One folder + tests, no ports ceremony; plain MVC also fine while the slice stays simple. Extract use cases or layers when rules grow (Gall's Law). Tests execute the folder directly, stubbing I/O at its edges.

## What not to do

- Do not rely on convention alone for boundaries: encode the dependency rule, module boundaries, and barrel entry points in the linter (restricted imports) and in workspace `package.json` `exports`, so violations fail the check instead of slipping through review.
- Do not lump all infrastructure in one tree (`infra/` with web controllers next to database repositories); it lets outer layers call each other around the domain (Périphérique antipattern). Split infrastructure per adapter and keep every crossing behind a port.
- Do not create global `controllers/`, `services/`, `models/` layers for a sliced system: that is horizontal sprawl with high coupling.
- Do not share a database-shaped type across slices. Map at each boundary.
- Do not add an event bus, CQRS, or a microservice split until a slice outgrows in-process calls (Gall's Law: evolve from a working simple system).
