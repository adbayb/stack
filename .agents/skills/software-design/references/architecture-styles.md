# Architecture Styles — slice first, layer second

Slice first, layer second. A slice is one business feature cut vertically through the layers, owning its handler, domain, ports, adapters, tests. Vertical slicing is mandatory for any application kind; splitting by modules is optional and fits bigger applications — clean-architecture candidates with heavy business rules — to enforce cohesion and minimize coupling between modules. Hexagonal/Clean Architecture/MVVM = how you organize the inside, chosen once per module (or per application when there are no modules) and kept consistent across its slices. Acronyms are expanded once in the `software-design` SKILL.md glossary.

The architecture within a module stays consistent across its slices. By its standalone nature, a module enables local decisions: module A with little logic may use MVC or transaction scripts while module B with extensive rules uses a layered architecture (Clean or Hexagonal architecture).

## Vertical slice (default)

- Structure by capability: one folder per feature under `src/` (e.g. `src/refund/`), named with a noun, owning its handler, domain, ports, adapters, tests — no `features/` container; the extra level adds nothing. (In a clean module, features take the use-case verb form instead — see Clean Architecture essentials.)
- Cross-slice communication only via explicit contracts or domain events. No deep imports (`../../other-slice/internals`).
- Each folder exposes its public surface through `index.ts`; import via the barrel, never deep into another folder's internals.
- Shared kernel holds only truly shared code and stays tiny; everything else is duplicated deliberately until the Rule of Three proves shared.

## Inside a slice

| Situation                                      | Inner style                  | Layout hint                                                          |
| ---------------------------------------------- | ---------------------------- | -------------------------------------------------------------------- |
| Business rules, multiple I/O (DB, queue, mail) | Hexagonal (ports & adapters) | `domain/`, `ports/`, `adapters/`, `usecase.ts`                       |
| Enterprise rules with presenters/mappers       | Clean architecture           | `entities/`, `useCases/`, `adapters/`, `frameworks/` pointing inward |
| UI-heavy, little domain                        | MVVM / MVP                   | `view`, `viewmodel` (no I/O), `model`/ports for data                 |
| Single script, CRUD, glue                      | Flat modular                 | one slice + tests; no ports ceremony                                 |

Dependency rule is absolute: inward only. Inner layers know nothing of outer layers. Adapters implement ports the inner layers own.

## Hexagonal essentials

- Ports are interfaces owned by the domain: `OrderRepository`, `Clock`, `Mailer`.
- Split ports by direction: inbound (use-case input boundaries, called by controllers) vs outbound (gateways/repositories the use cases call, implemented outside).
- Adapters are replaceable: `PostgresOrderRepository`, `FakeOrderRepository` (tests), `SmtpMailer`.
- Composition root wires real adapters; tests wire fakes. Domain never imports infrastructure.
- Persistence Ignorance: entities do not extend ORM base classes, carry decorators, or know table names.

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

- `view` / `viewmodel` (no I/O or side effects) / `model` plus ports for data. For UI-heavy slices with little domain: keep state transitions in the viewmodel, fetch through ports, stay testable without rendering.

## Flat modular essentials

- Single script, CRUD, or glue: one folder + tests, no ports ceremony. Transaction scripts or plain MVC are fine while the slice stays simple — extract use cases or layers when rules grow (Gall's Law). Tests execute the folder directly, stubbing I/O at its edges.

## What not to do

- Do not rely on convention alone for boundaries — encode the dependency rule, module boundaries, and barrel entry points in the linter (restricted imports) and in workspace `package.json` `exports`, so violations fail the check instead of slipping through review.
- Do not lump all infrastructure in one tree (`infra/` with web controllers next to database repositories) — it lets outer layers call each other around the domain (Périphérique antipattern). Split infrastructure per adapter and keep every crossing behind a port.
- Do not create global `controllers/`, `services/`, `models/` layers for a sliced system — that is horizontal sprawl with high coupling.
- Do not share a database-shaped type across slices. Map at each boundary.
- Do not add event bus, CQRS, or microservice split until a slice outgrows in-process calls (Gall's Law: evolve from a working simple system).
