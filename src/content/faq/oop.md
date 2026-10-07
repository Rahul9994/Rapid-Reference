## What are the four pillars of OOP?

1. **Encapsulation** — bundle data and methods; hide internal state behind an interface.
2. **Abstraction** — expose *what* an object does, hide *how*.
3. **Inheritance** — derive new classes from existing ones to reuse and extend behaviour.
4. **Polymorphism** — one interface, many implementations (the same call behaves differently per type).

## What is the difference between a class and an object?

A **class** is a blueprint that defines attributes and methods; an **object** (instance) is a concrete realisation of that blueprint with its own state. `Dog` is a class; `rex = Dog("Rex")` is an object.

## What is encapsulation and how does Python implement it?

Encapsulation restricts direct access to an object's internals so it can only be changed through controlled methods. Python uses conventions: `_name` (internal), `__name` (name-mangled to `_Class__name`), and `@property` getters/setters to validate or compute attributes while keeping attribute syntax.

## Abstraction vs encapsulation?

**Abstraction** is about design — showing only essential features (e.g. a `Shape.area()` interface). **Encapsulation** is about implementation — hiding and protecting the data that makes it work. Abstraction answers "what", encapsulation guards "how".

## What is inheritance? What types exist?

A mechanism where a child class acquires the attributes and methods of a parent (**is-a** relationship). Types: single, multilevel, hierarchical, multiple and hybrid. Python supports all, including multiple inheritance resolved by the **MRO** (C3 linearization).

## What is polymorphism? Compile-time vs runtime?

The ability of different objects to respond to the same message in their own way. **Compile-time (static)** polymorphism = method/operator overloading (resolved at compile time in Java/C++). **Runtime (dynamic)** polymorphism = method overriding with dynamic dispatch. Python mainly uses runtime polymorphism, duck typing and operator overloading via dunder methods.

## Method overloading vs method overriding?

| Overloading | Overriding |
|---|---|
| same name, different parameters, same class | same signature, redefined in a subclass |
| resolved at compile time (Java/C++) | resolved at runtime |
| Python: not supported directly — use defaults, `*args`, `singledispatch` | Python: supported; call the parent with `super()` |

## What is an abstract class? How is it different from an interface?

An abstract class can't be instantiated and may contain both abstract methods (no implementation) and concrete methods/state. An **interface** (Java) traditionally declares only method signatures that implementing classes must provide; a class can implement many interfaces but extend one class. In Python, both are modelled with `abc.ABC` and `@abstractmethod`.

## What is the diamond problem?

When a class inherits from two classes that share a common base, it's ambiguous which version of an inherited method to use and whether the base is included twice. Python resolves it with the **MRO** (`D.__mro__`), visiting each class once in a consistent order; `super()` follows the MRO. Java avoids it by allowing only single class inheritance.

## Composition vs inheritance?

Inheritance models **is-a** (a `Car` is a `Vehicle`); composition models **has-a** (a `Car` has an `Engine`). Prefer composition for flexibility and looser coupling — you can swap components at runtime and avoid deep, fragile hierarchies. Use inheritance when there's a genuine substitutable is-a relationship.

## What is a constructor? What does `__init__` do vs `__new__`?

A constructor sets up a new object. In Python, `__new__` **creates** the instance (rarely overridden; used for immutable types and singletons) and `__init__` **initialises** it with attributes. Python has no constructor overloading — use default arguments or `@classmethod` factories.

## What is `self` in Python?

The conventional name for the instance passed automatically as the first argument of instance methods. `obj.method(x)` is equivalent to `Class.method(obj, x)`. It's explicit (not a keyword) so attribute access on the instance is always clear.

## What are access modifiers?

Keywords controlling visibility — in Java/C++: `public`, `protected`, `private` (and package-private in Java). Python has no enforced modifiers; it relies on naming conventions (`_protected`, `__private` with name mangling) and the "consenting adults" philosophy.

## What are the SOLID principles?

- **S**ingle Responsibility — a class should have one reason to change.
- **O**pen/Closed — open for extension, closed for modification.
- **L**iskov Substitution — subclasses must be usable wherever the parent is expected.
- **I**nterface Segregation — prefer small, specific interfaces over fat ones.
- **D**ependency Inversion — depend on abstractions, not concrete implementations.

## What is a design pattern? Name a few.

A reusable solution template for a recurring design problem. **Creational**: Singleton, Factory, Builder. **Structural**: Adapter, Decorator, Facade, Proxy. **Behavioral**: Observer, Strategy, Iterator, Command. Example — Strategy: pass different sorting/pricing algorithms as interchangeable objects instead of using if-else chains.
