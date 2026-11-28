# Hexagonal Architecture

Ports and adapters inside one slice, following https://jmgarridopaz.github.io/content/hexagonalarchitecture-ig/intro.html (faithful to Cockburn). Goal: drivers drive the hexagon in isolation from real devices; test cases are the first drivers: the hexagon is done when it passes with test doubles, real adapters come after. Names below are TypeScript; apply the target language's conventions (`language-conventions.md`).

## Structure

```text
src/parking/
├── hexagon/
│   ├── ports/
│   │   ├── driver/park-car-port.ts           # ParkCarPort + input/output DTOs
│   │   └── driven/
│   │       ├── rates-port.ts                 # RatesPort
│   │       ├── permit-storage-port.ts        # PermitStoragePort
│   │       └── clock-port.ts                 # ClockPort
│   ├── park-car.ts                           # ParkCar implements ParkCarPort
│   ├── park-car.test.ts                      # first driver: hexagon + fake adapters
│   └── permit.ts                             # entity
├── adapters/
│   ├── http/park-car-port.ts                 # HttpParkCar (driver, real)
│   ├── fake/rates-port.ts                    # FakeRates (driven, default)
│   ├── fake/permit-storage-port.ts           # FakePermitStorage
│   ├── file/rates-port.ts                    # FileRates (driven, real)
│   └── postgres/permit-storage-port.ts       # PostgresPermitStorage
└── startup/http.ts                           # composition root for the http driver
```

## Naming

| Element        | Form                           | Example                                |
| -------------- | ------------------------------ | -------------------------------------- |
| Driver port    | use-case verb + `Port`         | `ParkCarPort`                          |
| Business logic | driver port name minus `Port`  | `ParkCar`                              |
| Driven port    | role noun + `Port`             | `PermitStoragePort`, `RatesPort`       |
| Adapter        | tech + port name minus `Port`  | `HttpParkCar`, `PostgresPermitStorage` |
| Entity         | domain noun inside the hexagon | `Permit`                               |
| Startup        | driver tech                    | `startup/http`, `startup/cli`          |

## Rules

- Hexagon = business logic plus its ports. Ports belong to the hexagon (not a dependency layer) and are grouped by side: driver (actors ask the hexagon) vs driven (the hexagon asks repositories/recipients). The hexagon implements driver ports, receives driven ports by constructor, and imports nothing from `adapters/`, `startup/`, or frameworks.
- Ports name a purpose, never a technology (`PostgresPort`) or a bare entity (`PermitPort`). One driver port per use case, implemented by one business-logic unit of the same name; each port publishes its interface + DTOs and hides its implementation. No `Service`, `Impl`, or `Adapter` suffixes: the folder already says the role.
- Hexagon inner structure is not part of the pattern: keep use cases and entities flat, and split into `application/` + `domain/` folders only once several use cases share invariants (Gall's Law).
- Keep a port in the slice that consumes it; promote a port, entity, or adapter used by other slices only past the sharing threshold (`cohesion-coupling.md`), never into a module-level `domain/`, `infrastructure/`, or `features/` tree.
- Adapters are grouped by tech, then port (`adapters/<tech>/<port-name>`); the side comes from the port. Provide at least two per port: a default adapter for isolated tests (driver: test harness; driven: stub/fake/mock) and a real one. Each depends on the hexagon at exactly one port (SRP), maps between tech and port DTOs at the boundary, and never imports another adapter.
- Startup: one entry per driver tech (`startup/<tech>`); tests wire their own doubles. Per entry: 1. instantiate one driven adapter per driven port, 2. instantiate the hexagon injecting them, 3. instantiate driver adapters with their driver ports, 4. run them.
- Configurable Dependency on both sides (the triggerer knows the dependency: driver adapter -> driver port; hexagon -> driven port).
- Persistence Ignorance: entities do not extend ORM base classes, carry decorators, or know table names. Pass the clock as a parameter or through a driven port.

## Example

```ts
// hexagon/ports/driver/park-car-port.ts
export type ParkCarInput = { plate: string; zone: string; minutes: number };
export type ParkCarOutput = { permitId: string; expiresAt: Date; price: number };
export type ParkCarPort = { parkCar(input: ParkCarInput): Promise<ParkCarOutput> };

// hexagon/park-car.ts
export class ParkCar implements ParkCarPort {
	constructor(
		private readonly rates: RatesPort,
		private readonly permits: PermitStoragePort,
		private readonly clock: ClockPort,
	) {}

	async parkCar(input: ParkCarInput): Promise<ParkCarOutput> {
		const rate = await this.rates.findByZone(input.zone);
		const permit = Permit.issue({ ...input, rate, now: this.clock.now() });

		await this.permits.save(permit);

		return { permitId: permit.id, expiresAt: permit.expiresAt, price: permit.price };
	}
}

// adapters/postgres/permit-storage-port.ts
export class PostgresPermitStorage implements PermitStoragePort {
	constructor(private readonly sql: Sql) {}

	async save(permit: Permit): Promise<void> {
		await this.sql`insert into permits ${this.sql(toRow(permit))}`;
	}
}

// startup/http.ts
const permits = new PostgresPermitStorage(createSql(process.env.DATABASE_URL));
const parkCar = new ParkCar(new FileRates(process.env.RATES_PATH), permits, new SystemClock());
const server = createServer();

new HttpParkCar(parkCar).mount(server);
server.listen(3000);

// hexagon/park-car.test.ts
test("should price the permit from the zone rate", async () => {
	const parkCar = new ParkCar(new FakeRates({ A: 2 }), new FakePermitStorage(), new FakeClock());

	expect((await parkCar.parkCar({ plate: "AB-123", zone: "A", minutes: 60 })).price).toBe(2);
});
```
