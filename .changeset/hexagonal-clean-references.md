---
"@adbayb/stack": minor
---

Add `design-software` references `hexagonal.md` and `clean-architecture.md`, each with the same structure, naming, rules, and worked example sections. Hexagonal follows Garrido/Cockburn: ports inside the hexagon (`hexagon/ports/driver|driven`), `<UseCase>Port` driver ports implemented by same-named business logic, `<Role>Port` driven ports, adapters in `adapters/<tech>/<port-name>`, and one `startup/<tech>` entry per driver technology.
