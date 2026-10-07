Inheritance lets a class reuse and extend another class. Polymorphism lets different classes respond to the same interface in their own way.

## Basic inheritance

```python
class Animal:
    def __init__(self, name):
        self.name = name

    def speak(self):
        return "..."

    def describe(self):
        return f"{self.name} says {self.speak()}"

class Dog(Animal):                 # Dog IS-A Animal
    def speak(self):               # override
        return "Woof"

class Cat(Animal):
    def speak(self):
        return "Meow"

for pet in [Dog("Rex"), Cat("Tom"), Animal("Generic")]:
    print(pet.describe())
```

```output
Rex says Woof
Tom says Meow
Generic says ...
```

`describe` is written once in `Animal`, but each object calls *its own* `speak` — that's runtime polymorphism.

## super(): extending parent behaviour

```python
class Employee:
    def __init__(self, name, salary):
        self.name = name
        self.salary = salary

    def pay(self):
        return self.salary

class Manager(Employee):
    def __init__(self, name, salary, bonus):
        super().__init__(name, salary)    # reuse the parent initializer
        self.bonus = bonus

    def pay(self):
        return super().pay() + self.bonus # extend, don't duplicate

m = Manager("Grace", 100, 20)
print(m.pay(), isinstance(m, Employee), issubclass(Manager, Employee))   # 120 True True
```

> [!WARNING]
> If a subclass defines `__init__` and forgets `super().__init__(...)`, the parent's attributes are never set → `AttributeError` later.

## Types of inheritance

```diagram Inheritance shapes
 Single        Multilevel       Hierarchical        Multiple
  A              A                   A              A     B
  │              │                 / | \             \   /
  B              B                B  C  D              C
                 │
                 C
```

Python supports all of them, including **multiple inheritance**.

## Multiple inheritance and the MRO

The **Method Resolution Order** decides which parent's method is used. Python computes it with the **C3 linearization** algorithm.

```python
class A:
    def hello(self):
        return "A"

class B(A):
    def hello(self):
        return "B → " + super().hello()

class C(A):
    def hello(self):
        return "C → " + super().hello()

class D(B, C):
    def hello(self):
        return "D → " + super().hello()

print(D().hello())
print([k.__name__ for k in D.__mro__])
```

```output
D → B → C → A
['D', 'B', 'C', 'A', 'object']
```

```diagram The diamond problem — resolved by the MRO
        A
       / \
      B   C
       \ /
        D        MRO: D → B → C → A → object  (A runs once)
```

`super()` doesn't mean "my parent" — it means "**the next class in the MRO**". That's why `B.hello` calls `C.hello`, not `A.hello`.

### Mixins

Small classes that add one capability, combined via multiple inheritance:

```python
import json

class JsonMixin:
    def to_json(self):
        return json.dumps(self.__dict__)

class User(JsonMixin):
    def __init__(self, name):
        self.name = name

print(User("Ada").to_json())   # {"name": "Ada"}
```

## Polymorphism in Python

### 1. Method overriding (runtime polymorphism)

Shown above with `speak()`.

### 2. Duck typing

"If it walks like a duck and quacks like a duck…" — Python cares about **behaviour**, not type:

```python
class Duck:
    def quack(self):
        return "Quack"

class Robot:
    def quack(self):
        return "Beep-quack"

def make_it_quack(thing):          # no isinstance check needed
    return thing.quack()

print(make_it_quack(Duck()), make_it_quack(Robot()))
```

### 3. Operator overloading (dunder methods)

```python
class Vector:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __add__(self, other):
        return Vector(self.x + other.x, self.y + other.y)

    def __mul__(self, k):
        return Vector(self.x * k, self.y * k)

    def __eq__(self, other):
        return isinstance(other, Vector) and (self.x, self.y) == (other.x, other.y)

    def __repr__(self):
        return f"Vector({self.x}, {self.y})"

print(Vector(1, 2) + Vector(3, 4), Vector(1, 2) * 3)   # Vector(4, 6) Vector(3, 6)
```

### 4. Method overloading? Not really

Python doesn't support multiple methods with the same name and different signatures — the last definition wins. Use default arguments, `*args`, or `functools.singledispatch`:

```python
from functools import singledispatch

@singledispatch
def area(shape):
    raise NotImplementedError

@area.register
def _(r: float):
    return 3.14159 * r * r

@area.register
def _(dims: tuple):
    w, h = dims
    return w * h

print(area(2.0), area((3, 4)))
```

## Abstract base classes

Force subclasses to implement certain methods:

```python
from abc import ABC, abstractmethod

class Shape(ABC):
    @abstractmethod
    def area(self) -> float: ...

    def describe(self):
        return f"{type(self).__name__} with area {self.area():.2f}"

class Circle(Shape):
    def __init__(self, r):
        self.r = r

    def area(self):
        return 3.14159 * self.r ** 2

# Shape()  → TypeError: Can't instantiate abstract class Shape ...
print(Circle(1).describe())     # Circle with area 3.14
```

## Composition over inheritance

Inheritance models **is-a**; composition models **has-a**. Prefer composition when you only need to reuse behaviour:

```python
class Engine:
    def start(self):
        return "vroom"

class Car:
    def __init__(self):
        self.engine = Engine()       # Car HAS-AN Engine

    def start(self):
        return self.engine.start()   # delegate
```

> [!INTERVIEW]
> - MRO uses C3 linearization; inspect it with `Class.__mro__` or `Class.mro()`.
> - `super()` follows the MRO, which makes cooperative multiple inheritance work.
> - Python achieves polymorphism via overriding, duck typing and operator overloading — not signature-based overloading.
> - Abstract classes (`abc.ABC` + `@abstractmethod`) can't be instantiated.

> [!REMEMBER]
> Override to specialise, call `super()` to extend, read the MRO for diamonds, use ABCs to define contracts, and prefer composition when "is-a" doesn't really hold.
