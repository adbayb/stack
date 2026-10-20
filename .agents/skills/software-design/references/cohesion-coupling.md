# Cohesion + Coupling

High cohesion: things that change together live together. Low coupling: dependencies are narrow, explicit, and point toward stable code.

## Cohesion

- Functional cohesion per module: all elements serve the single stated purpose.
- Co-locate the handler, domain/hexagon, tests, and mapping for one use case in one folder.
- Sharing threshold (this reference owns the rule; other references cite it). Tolerate duplication and promote stepwise: an individual symbol at the second existing consumer; a shared module, package, or shared entity at the Rule of Three (third real consumer: one owner, versioned, free of slice-specific branches); a cross-module Shared Kernel only when additional modules need it. Planned consumers and same-package tests do not count; published-API consumers do.

## Coupling

- Prefer a direct call through the existing public contract or an explicit parameter; inject a port when isolation or substitution needs it. Use events when consumers need independent reactions and eventual consistency is acceptable; account for delivery failures, duplicates, and ordering. Do not add messaging infrastructure just to reduce imports.
- Tell-Don't-Ask / Law of Demeter: pass intent (`refund(orderId)`), do not pull entrails (`order.getCustomer().getWallet().debit()`). Avoid global mutable state, deep relative imports across slices/modules, and cross-slice table joins.
- Depend in the direction of stability; hide volatile details behind ports. Keep dependencies between modules/slices/packages narrow, intentional, and pointing toward stable, lower-level code. No cycles.
- Measure informally: "If I change X, how many files must change?" One is ideal; more than three signals Shotgun Surgery or Inappropriate Intimacy.
- Prefer platform features and existing dependencies. Add a third-party dependency only when adopting it costs less than owning the code, weighing maintenance health, security exposure, size, and license; follow `security.md` for locking and upgrades.

## Resource and effect ownership

- Give subscriptions, file handles, connections, and background tasks an explicit owner and cleanup path, including failure and cancellation. Await asynchronous work or transfer ownership to a host that observes its failures.
- Give remote operations a timeout or explicit lifetime/cancellation contract; propagate cancellation where supported. Retry only transient failures within a bounded attempt/time budget; retry a side effect only when it is idempotent or protected by an idempotency key. Avoid stacked retry policies across layers.
- For idempotency keys, atomically claim the key with the effect or durable workflow state; bind it to the operation and input, and define duplicate-in-flight and conflicting-input behavior. A key checked only in memory does not prevent duplicate effects across workers or restarts.
- Bound concurrency, queues, and input/result size at workload boundaries; stream or paginate when loading everything violates those bounds. Apply backpressure or reject overload explicitly. Measure a concrete bottleneck before adding caches, batching infrastructure, or parallelism; define cache invalidation and freshness when caching is required.
