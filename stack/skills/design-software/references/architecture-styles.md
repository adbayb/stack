# Architecture Styles: slice first, layer second

A slice is one business feature cut vertically through the layers, owning its handler, domain/hexagon, adapters, and tests. Vertical slicing is mandatory. Modules are optional: use them for larger applications with heavy rules, where they enforce cohesion and minimize coupling. Choose one inner style per module (or app) and keep it consistent; a module may choose locally (e.g. MVC/flat for light logic, Clean/Hexagonal for heavy rules).

Folder and file names below illustrate boundaries; apply the target language and project's naming conventions as described in `language-conventions.md`.

## Vertical slice (default)

- Structure by capability: one folder per feature under `src/` (e.g. `src/refund/`), named with a noun, owning its handler, domain/hexagon, adapters, and tests. No `features/` container; the extra level adds nothing.
  In a clean module, features take the use-case verb form instead: see `clean-architecture.md`.
- Cross-slice communication only via explicit contracts or domain events. No deep imports (`../../other-slice/internals`).
- In TypeScript/JavaScript projects, hexagonal/clean modules expose each folder's public surface through a language-appropriate barrel (`index.ts` for TypeScript, `index.js` for JavaScript); any such barrel, including a package entrypoint, contains only re-export declarations, including type-only re-exports where supported, with no imports, local declarations, or executable implementation. Keep startup and wiring in runtime entrypoints or composition roots, not in barrels. Import via the barrel, never deep into another folder's internals. For other languages, use the project's idiomatic module and export conventions rather than requiring barrels. Flat/MVVM slices may import directly within the slice, but never deep-import another slice's internals.
- Shared kernel holds only truly shared code and stays tiny; everything else is duplicated deliberately until the sharing threshold (`cohesion-coupling.md`) proves shared.

## Inside a slice

| Situation                                                                            | Inner style                  | Layout hint                                                                                                            |
| ------------------------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Same logic through swappable adapters/techs or contexts; hexagon tested in isolation | Hexagonal (ports & adapters) | `hexagon/ports/driver\|driven/`, `hexagon/<use-case>`, `adapters/<tech>/<port-name>`, `startup/<tech>`: `hexagonal.md` |
| Business logic built on enterprise rules shared across apps/modules                  | Clean architecture           | `modules/<context>/src/<feature>/{use-cases,adapters,frameworks}/`, `hosts/<driver>`: `clean-architecture.md`          |
| UI-driven with rich view state, thin domain logic                                    | MVVM / MVP                   | `view`, `viewmodel` (no I/O), `model`/ports for data                                                                   |
| Single script, CRUD, glue (transaction script)                                       | Flat modular                 | one slice + tests; no ports ceremony                                                                                   |

In layered styles, dependencies point inward: inner layers know nothing of outer layers, and adapters implement inner-owned ports. Flat slices need no artificial layers; keep their I/O explicit and testable.

After choosing Hexagonal or Clean, load its reference (`hexagonal.md` or `clean-architecture.md`) for structure, naming, rules, and a worked example.

## MVVM essentials

- `view` / `viewmodel` (no I/O or side effects) / `model` plus ports for data. For UI-driven slices with rich view state and thin domain logic: keep state transitions in the viewmodel, fetch through ports, stay testable without rendering.

## Flat modular essentials

Follows the transaction-script pattern (https://martinfowler.com/eaaCatalog/transactionScript.html): one procedure per presentation request calls the database directly or through a thin wrapper; extract shared subtasks as subprocedures.

- One folder + tests, no ports ceremony; plain MVC also fine while the slice stays simple. Extract use cases or layers when rules grow (Gall's Law). Tests execute the folder directly, stubbing I/O at its edges.

## What not to do

- Do not rely on convention alone for boundaries: encode dependency rules and module boundaries in the project's lint and package tooling where supported. In TypeScript/JavaScript workspaces, use restricted-import lint rules and `package.json` `exports` where appropriate; in other ecosystems, use their equivalent boundary checks.
- Do not lump all infrastructure in one tree (`infra/` with web controllers next to database repositories); it lets outer layers call each other around the domain (Périphérique antipattern). Split infrastructure per adapter and keep every crossing behind a port.
- Do not create global `controllers/`, `services/`, `models/` layers for a sliced system: that is horizontal sprawl with high coupling.
- Do not share a database-shaped type across slices. Map at each boundary.
- Do not add an event bus, CQRS, or a microservice split until a slice outgrows in-process calls (Gall's Law: evolve from a working simple system).
