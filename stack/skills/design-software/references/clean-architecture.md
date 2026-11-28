# Clean Architecture

Layered modules for business-heavy bounded contexts, following the reference implementation at https://github.com/adbayb/clean-architecture. Goal: enterprise rules (entities) and application rules (use cases) stay independent of views, data sources, and frameworks; source imports point inward only. Names below are TypeScript; apply the target language's conventions (`language-conventions.md`).

## Structure

```text
src/
├── hosts/web/main.tsx                         # composition root + system entry point
└── modules/
    ├── shared/                                # Shared Kernel: shareable entities, value objects
    └── catalog/                               # one module per bounded context
        ├── package.json
        └── src/
            ├── get-products/                  # feature: use-case verb form
            │   ├── use-cases/get-products-use-case.ts   # interactor + input/output data
            │   ├── adapters/
            │   │   ├── get-products-controller.ts       # input -> use case
            │   │   ├── get-products-presenter.ts        # output data -> view model
            │   │   └── get-products-view-model.ts
            │   └── frameworks/get-products-view.tsx     # view
            └── product/                       # shared entity: noun form, no use-cases/
                ├── entities/product-entity.ts           # entity + gateway boundary (port)
                ├── adapters/product-entity-gateway.ts   # data source -> entity
                └── frameworks/dummy-json-data-source.ts # data source (tech)
```

## Naming

| Element       | Form                                              | Example                                        |
| ------------- | ------------------------------------------------- | ---------------------------------------------- |
| Feature       | use-case verb                                     | `get-products/`                                |
| Use case      | `<feature>-use-case` file, feature + `Interactor` | `GetProductsInteractor`                        |
| Port          | owner + `Boundary`                                | `ProductEntityGatewayBoundary`                 |
| Adapter       | feature or entity + role                          | `GetProductsPresenter`, `ProductEntityGateway` |
| Framework     | feature + `View`, tech + `DataSource`             | `GetProductsView`, `DummyJsonDataSource`       |
| Shared entity | domain noun                                       | `product/`, `ProductEntity`                    |
| Host          | driver                                            | `hosts/web`, `hosts/cli`                       |

## Rules

- Split by module: one module per bounded context (`modules/<context>/`) owns everything from presentation to data. Modules are decision-autonomous, so only business-heavy modules pay for these layers.
- Top-level entries inside a module are features and shared entities side by side; second-level directories are the layers, so the dependency rule is materialized in the folder tree.
- Layers, inward only: `frameworks/` (views, data sources, DB clients) -> `adapters/` (controllers, presenters, gateways) -> `use-cases/` (application business rules) -> `entities/` (enterprise business rules). Runtime calls may point outward through inner-owned boundaries; source imports must not.
- Each module is a package or workspace unit; use the target ecosystem's manifest and module naming. Cross-module imports use public package, crate, or module names rather than deep relative imports; build/test run per unit. Package membership alone does not prevent forbidden imports: enforce boundaries with tooling (`architecture-styles.md`).
- Extract a new module when language diverges (same word, different meaning), change cadence splits, or team ownership demands it. Never for a single team shipping one deploy with one language; that is slices, not modules.
- A shared entity is a full vertical unit, not just a domain class: it embeds `entities/` + `adapters/` + `frameworks/` (no `use-cases/`) and lives as a sibling of features under `src/`, never in a `shared/` folder. Depend on it only through its boundaries, never feature-to-feature.
- Promoted code moves to a sibling shared entity, then to the cross-module Shared Kernel (`modules/shared/`), which is not a dumping ground; `cohesion-coupling.md` owns when to promote.
- `hosts/` is the outermost layer: one main component per driver (web UI, CLI, back-end server) instantiating the inner layers and serving as system entry point.
- Never bypass the layers: a controller must not call a gateway or data source directly; every call crosses a use case.
- Push-based presenters: the use case hands output data to the presenter boundary, never view-shaped data returned to the controller. Never mix controller and presenter in one unit, so new output formats (web, CLI, JSON) plug in later.

## Example

```ts
// product/entities/product-entity.ts
export type ProductEntityGatewayBoundary = { getMany(): Promise<Result<ProductEntity>[]> };

// get-products/use-cases/get-products-use-case.ts
export type GetProductsOutputData = { title: string; price: number }[];

export const createGetProductsInteractor = (
	gateway: ProductEntityGatewayBoundary,
	presenter: Presenter<GetProductsOutputData>,
) => ({
	async execute() {
		const products = (await gateway.getMany()).filter(isSuccess).map(({ payload }) => payload);

		presenter.display(products.map(({ title, price }) => ({ title, price: price.value })));
	},
});

// get-products/adapters/get-products-presenter.ts
export const createGetProductsPresenter = (onChange: (viewModel: GetProductsViewModel) => void) => ({
	display(output: GetProductsOutputData) {
		onChange(output.map(({ title, price }) => ({ title: title.toUpperCase(), price: formatUsd(price) })));
	},
});

// product/adapters/product-entity-gateway.ts
export const createProductEntityGateway = (dataSource: ProductDataSourceBoundary) => ({
	async getMany() {
		const output = await dataSource.readMany();

		return output.type === "failure" ? [output] : output.payload.map(createProductEntity);
	},
});

// hosts/web/main.tsx: composition root
export const Main = () => (
	<ProductEntityGatewayProvider dataSource={createDummyJsonDataSource()}>
		<GetProductsView />
	</ProductEntityGatewayProvider>
);
```
