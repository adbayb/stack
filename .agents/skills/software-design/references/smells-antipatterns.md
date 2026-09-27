# Smells & Anti-Patterns — reject list

Catalog: https://refactoring.guru/refactoring/smells. If code matches any row, refactor before shipping. Acronyms are expanded once in the `software-design` SKILL.md glossary.

## Bloaters

- **Long Method:** 20+ lines, multiple levels, mixed abstraction → Extract Method, Decompose Conditional, Replace with Method Object.
- **Large Class:** many fields/methods, several responsibilities → Extract Class/Subclass.
- **Primitive Obsession:** strings/ints carrying domain meaning (`email: string`, `status: number`) → Value Objects (`Email`, `OrderStatus`).
- **Long Parameter List:** 4+ params or boolean flags → Parameter Object, Preserve Whole Object, split overloads.
- **Data Clumps:** same group of params/fields traveling together → new class.

## OO Abusers

- **Switch Statements / type-code chains:** same switch in many places → Strategy / Polymorphism / State.
- **Refused Bequest:** subclass ignoring inherited behavior → replace inheritance with delegation.
- **Temporary Field:** field valid only in one path → split class or pass as parameter.
- **Alternative Classes with Different Interfaces:** two classes doing the same thing differently → unify behind one port.

## Change Preventers

- **Divergent Change:** one module edited for unrelated reasons → split by responsibility.
- **Shotgun Surgery:** one change ripples across many files → Move Method/Field, centralize behind a port.
- **Parallel Inheritance Hierarchies:** adding a subclass forces a mirror subclass elsewhere → collapse or compose.

## Dispensables (delete on sight)

- Comments stating the obvious, Duplicate Code, Dead Code, Lazy Class (does too little), Data Class (fields without behavior — add behavior or collapse), Speculative Generality ("for future use").

## Couplers

- **Feature Envy:** method using another object's data more than its own → Move Method.
- **Inappropriate Intimacy:** reaching into internals → Hide Delegate, Encapsulate.
- **Message Chains:** `a.getB().getC().do()` → Law of Demeter violation; inject C directly.
- **Middle Man:** class delegating everything → Inline or give it real behavior.
- **Incomplete Library Class:** awkward external API → Adapter (Introduce Foreign Method / Local Extension).

## Architecture anti-patterns

- **Leaky Abstraction:** DB/HTTP/SDK types crossing the domain boundary. Fix with port + mapper.
- **God Object / Blob:** central class knowing everything → slice vertically, extract use cases.
- **Spaghetti / Lava Flow:** dead/experimental paths left in — delete, do not comment.
- **Golden Hammer:** same pattern (e.g., Singleton, event bus, inheritance) forced everywhere.
- **Vendor Lock-in by accident:** domain importing framework decorators/ORM base classes.
- **Premature distribution:** microservices/shared libs before a working modular monolith.
