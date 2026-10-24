# Smells & Anti-Patterns: reject list

Catalog: https://refactoring.guru/refactoring/smells. Use these as diagnostic prompts, not automatic rewrite commands. Establish the harmful consequence and apply the owning reference's exceptions before fixing touched code; leave unrelated matches for a scoped pass. Load `patterns.md` before choosing a named pattern.

## Bloaters

- **Long Method:** length combined with multiple levels, mixed abstraction, or hard-to-follow logic -> consider Extract Method or Decompose Conditional when it improves cohesion and readability; line count alone is not a violation. Use Replace with Method Object only when the method's state and behavior justify it.
- **Large Class:** many fields/methods, several responsibilities -> Extract Class/Subclass.
- **Primitive Obsession:** repeated validation or interchangeable primitives permit invalid domain states -> consider a validated value type or discriminated union. A domain noun alone does not justify a wrapper.
- **Long Parameter List:** inspect grouping, boolean traps, and responsibilities using `api-surface.md`; do not extract an object just to reduce the count.
- **Data Clumps:** same group of params/fields traveling together -> new class.

## OO Abusers

- **Switch Statements / type-code chains:** same switch in many places -> Strategy / Polymorphism / State.
- **Refused Bequest:** subclass ignoring inherited behavior -> replace inheritance with delegation.
- **Temporary Field:** field valid only in one path -> split class or pass as parameter.
- **Alternative Classes with Different Interfaces:** two classes doing the same thing differently -> unify behind one port.

## Change Preventers

- **Divergent Change:** one module edited for unrelated reasons -> split by responsibility.
- **Shotgun Surgery:** one change ripples across many files -> Move Method/Field, centralize behind a port.
- **Parallel Inheritance Hierarchies:** adding a subclass forces a mirror subclass elsewhere -> collapse or compose.

## Dispensables

- Remove dead code, obvious comments, and speculative generality. A small class is wasteful only when it adds no contract or meaning.
- For Duplicate Code, use the knowledge-ownership rule in `clean-code.md` and sharing threshold in `cohesion-coupling.md`; similar text alone is insufficient.
- Data-only DTOs, events, and immutable records are legitimate contracts. A Data Class is a smell when behavior that owns its invariants lives elsewhere; move that behavior rather than adding methods for appearance.

## Couplers

- **Feature Envy:** method using another object's data more than its own -> Move Method.
- **Inappropriate Intimacy:** reaching into internals -> Hide Delegate, Encapsulate.
- **Message Chains:** inspect collaborator traversal using `cohesion-coupling.md`; fluent builders and transformations of plain data are not collaborator chains.
- **Middle Man:** class delegating everything -> Inline or give it real behavior.
- **Incomplete Library Class:** awkward external API -> Adapter (Introduce Foreign Method / Local Extension).

## Architecture anti-patterns

- **Leaky Abstraction:** DB/HTTP/SDK types crossing the domain boundary. Fix with port + mapper.
- **God Object / Blob:** central class knowing everything -> slice vertically, extract use cases.
- **Spaghetti / Lava Flow:** dead/experimental paths left in: delete, do not comment.
- **Golden Hammer:** same pattern (e.g., Singleton, event bus, inheritance) forced everywhere.
- **Vendor Lock-in by accident:** domain importing framework decorators/ORM base classes.
- **Premature distribution:** microservices/shared libs before a working modular monolith.
