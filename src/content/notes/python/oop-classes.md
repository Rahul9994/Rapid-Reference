Object-oriented programming bundles **data (attributes)** and **behaviour (methods)** into objects. In Python, everything — ints, functions, classes themselves — is an object.

## The four pillars (quick map)

| Pillar | Idea | Python tools |
|---|---|---|
| Encapsulation | Hide internal state behind an interface | `_name`, `__name`, `@property` |
| Abstraction | Expose *what*, hide *how* | abstract base classes (`abc`) |
| Inheritance | Reuse and extend behaviour | `class B(A)`, `super()` |
| Polymorphism | One interface, many implementations | overriding, duck typing, dunder methods |

## Defining a class

```python
class BankAccount:
    bank_name = "RR Bank"                 # class attribute (shared)

    def __init__(self, owner, balance=0): # initializer
        self.owner = owner                # instance attributes
        self.balance = balance

    def deposit(self, amount):            # instance method
        self.balance += amount
        return self.balance

    def __repr__(self):
        return f"BankAccount({self.owner!r}, {self.balance})"

acct = BankAccount("Ada", 100)
acct.deposit(50)
print(acct, acct.bank_name)               # BankAccount('Ada', 150) RR Bank
```

- `__init__` **initialises** an already-created object (`__new__` creates it).
- `self` is the instance, passed automatically: `acct.deposit(50)` ≡ `BankAccount.deposit(acct, 50)`.

## Class vs instance attributes

```python
class Dog:
    species = "Canis familiaris"   # shared by all dogs
    tricks = []                     # ⚠ shared mutable!

    def __init__(self, name):
        self.name = name            # unique per dog
        self.own_tricks = []        # ✅ per-instance list

a, b = Dog("Rex"), Dog("Fido")
a.tricks.append("roll")
print(b.tricks)          # ['roll'] — shared across instances!

a.species = "wolf"       # creates an INSTANCE attribute that shadows the class one
print(a.species, b.species, Dog.species)
```

```output
['roll']
wolf Canis familiaris Canis familiaris
```

> [!WARNING]
> Mutable class attributes (lists, dicts) are shared by every instance. Initialise per-object state inside `__init__`.

Attribute lookup order: **instance `__dict__` → class → parent classes (MRO)**.

## Three kinds of methods

```python
class Temperature:
    scale = "C"

    def __init__(self, degrees):
        self.degrees = degrees

    def to_f(self):                       # instance method: needs self
        return self.degrees * 9 / 5 + 32

    @classmethod
    def from_f(cls, f):                   # class method: gets the class → alternative constructor
        return cls((f - 32) * 5 / 9)

    @staticmethod
    def is_valid(degrees):                # static method: no self/cls, just namespaced
        return degrees >= -273.15

t = Temperature.from_f(212)
print(t.degrees, t.to_f(), Temperature.is_valid(-300))   # 100.0 212.0 False
```

| | First parameter | Access instance? | Access class? | Typical use |
|---|---|---|---|---|
| Instance method | `self` | ✅ | ✅ (via `type(self)`) | behaviour |
| `@classmethod` | `cls` | ❌ | ✅ | alternative constructors, factories |
| `@staticmethod` | — | ❌ | ❌ | utility logic tied to the class |

## String representations

```python
class Point:
    def __init__(self, x, y):
        self.x, self.y = x, y

    def __repr__(self):            # unambiguous, for developers (used in lists, REPL)
        return f"Point({self.x}, {self.y})"

    def __str__(self):             # readable, for users (used by print/str)
        return f"({self.x}, {self.y})"

p = Point(1, 2)
print(p, [p], repr(p))             # (1, 2) [Point(1, 2)] Point(1, 2)
```

If only `__repr__` is defined, `str()` falls back to it.

## Objects are mutable and passed by reference

```python
def rename(account, new_owner):
    account.owner = new_owner      # mutates the caller's object

acct = BankAccount("Ada")
rename(acct, "Grace")
print(acct.owner)                   # Grace
```

## Dataclasses: less boilerplate

```python
from dataclasses import dataclass, field

@dataclass
class Student:
    name: str
    grade: int = 0
    courses: list[str] = field(default_factory=list)   # safe mutable default

s1 = Student("Ada", 9)
s2 = Student("Ada", 9)
print(s1, s1 == s2)
```

```output
Student(name='Ada', grade=9, courses=[]) True
```

`@dataclass` auto-generates `__init__`, `__repr__` and `__eq__`. Options: `order=True` (comparison operators), `frozen=True` (immutable + hashable), `slots=True` (3.10+, lower memory).

## Introspection helpers

```python
print(isinstance(s1, Student), type(s1).__name__)   # True Student
print(hasattr(s1, "grade"), getattr(s1, "grade"))   # True 9
setattr(s1, "grade", 10)
print(vars(s1))      # {'name': 'Ada', 'grade': 10, 'courses': []}
```

## Building a data structure with a class

```python
class Stack:
    def __init__(self):
        self._items = []

    def push(self, x):
        self._items.append(x)

    def pop(self):
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self):
        return self._items[-1] if self._items else None

    def __len__(self):
        return len(self._items)

    def __bool__(self):
        return bool(self._items)

s = Stack()
s.push(1); s.push(2)
print(s.pop(), len(s), bool(s))   # 2 1 True
```

> [!INTERVIEW]
> - `self` is just the conventional name of the instance parameter — Python passes it explicitly.
> - `__init__` initialises; `__new__` constructs (used for immutables/singletons).
> - Class attributes are shared; instance attributes are per object.
> - `@classmethod` for factories, `@staticmethod` for helpers.

> [!REMEMBER]
> Put per-object state in `__init__`, define `__repr__` for debugging, use `@classmethod` constructors, and reach for `@dataclass` when a class is mostly data.
