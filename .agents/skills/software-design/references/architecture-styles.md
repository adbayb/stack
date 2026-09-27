# Architecture Styles — vertical slices with a clean inside

Slice first, layer second. Both ideas compose: vertical slice = how you split the system; hexagonal/clean/MVVM = how you organize inside one slice. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## Vertical slice (default)

- Structure by capability: `features/billing/refund/` owns its handler, domain, ports, adapters, tests.
- A slice is independently understandable and deployable in reasoning: request in → use case → domain → ports → adapters out.
- Cross-slice communication only via explicit contracts or domain events. No deep imports (`../../other-slice/internals`).
- Shared kernel (`shared/kernel/`) holds only truly shared value objects and stays tiny; everything else is duplicated deliberately until the Rule of Three proves shared.

## Inside a slice

| Situation                                      | Inner style                  | Layout hint                                                                    |
| ---------------------------------------------- | ---------------------------- | ------------------------------------------------------------------------------ |
| Business rules, multiple I/O (DB, queue, mail) | Hexagonal (ports & adapters) | `domain/`, `ports/`, `adapters/`, `usecase.ts`                                 |
| Enterprise rules with presenters/mappers       | Clean architecture           | `entities/`, `usecases/`, `interface-adapters/`, `frameworks/` pointing inward |
| UI-heavy, little domain                        | MVVM / MVP                   | `view`, `viewmodel` (no I/O), `model`/ports for data                           |
| Single script, CRUD, glue                      | Flat modular                 | one module + tests; no ports ceremony                                          |

Dependency rule is absolute: inward only. `domain` knows nothing of `adapters`, `frameworks`, or `view`. Adapters implement ports the domain owns.

## Hexagonal essentials

- Ports are interfaces owned by the domain: `OrderRepository`, `Clock`, `Mailer`.
- Adapters are replaceable: `PostgresOrderRepository`, `FakeOrderRepository` (tests), `SmtpMailer`.
- Composition root wires real adapters; tests wire fakes. Domain never imports infrastructure.
- Persistence Ignorance: entities do not extend ORM base classes, carry decorators, or know table names.

## What not to do

- Do not create global `controllers/`, `services/`, `models/` layers for a sliced system — that is horizontal sprawl with high coupling.
- Do not share a database-shaped type across slices. Map at each boundary.
- Do not add event bus, CQRS, or microservice split until a slice outgrows in-process calls (Gall's Law: evolve from a working simple system).
