Encapsulation means controlling access to an object's internal state. Python does it by **convention and properties** rather than strict access modifiers — and its "magic" (dunder) methods let your objects plug into the language itself.

## Access levels by convention

| Syntax | Meaning | Enforced? |
|---|---|---|
| `name` | public | — |
| `_name` | "internal, please don't touch" | No — convention only |
| `__name` | name-mangled to `_ClassName__name` | Partially — avoids accidental clashes |

```python
class Account:
    def __init__(self, owner, balance):
        self.owner = owner          # public
        self._history = []          # protected (by convention)
        self.__balance = balance    # "private" (name-mangled)

    def balance(self):
        return self.__balance

a = Account("Ada", 100)
print(a.balance())                  # 100
# print(a.__balance)                → AttributeError
print(a._Account__balance)          # 100 — mangling is not real security
```

> [!NOTE]
> Name mangling exists mainly to prevent subclasses from accidentally overriding a parent's internal attribute — not to hide data. "We are all consenting adults here."

## Properties: getters and setters, Pythonically

Start with a plain attribute; switch to `@property` later **without changing the public API**.

```python
class Temperature:
    def __init__(self, celsius):
        self.celsius = celsius          # goes through the setter below

    @property
    def celsius(self):
        return self._celsius

    @celsius.setter
    def celsius(self, value):
        if value < -273.15:
            raise ValueError("below absolute zero")
        self._celsius = value

    @property
    def fahrenheit(self):               # computed, read-only
        return self._celsius * 9 / 5 + 32

t = Temperature(25)
t.celsius = 30                          # validated
print(t.fahrenheit)                     # 86.0
# t.fahrenheit = 100                    → AttributeError: no setter
```

## Dunder (magic) methods

Dunder methods ("double underscore") let objects work with built-in syntax.

| Category | Methods | Triggered by |
|---|---|---|
| Construction | `__new__`, `__init__`, `__del__` | `Cls()`, garbage collection |
| Representation | `__repr__`, `__str__`, `__format__` | `repr()`, `print()`, f-strings |
| Comparison | `__eq__`, `__lt__`, `__le__`, `__gt__`, `__ge__`, `__ne__` | `==`, `<`, … |
| Hashing | `__hash__` | `hash()`, dict keys, sets |
| Arithmetic | `__add__`, `__sub__`, `__mul__`, `__truediv__`, `__radd__`, `__iadd__` | `+`, `-`, `*`, `/`, `+=` |
| Container | `__len__`, `__getitem__`, `__setitem__`, `__contains__`, `__iter__` | `len()`, `obj[k]`, `in`, `for` |
| Truthiness | `__bool__` (falls back to `__len__`) | `if obj:` |
| Callable | `__call__` | `obj()` |
| Context manager | `__enter__`, `__exit__` | `with obj:` |
| Attribute access | `__getattr__`, `__setattr__` | `obj.attr` |

### A custom container

```python
class Playlist:
    def __init__(self, songs):
        self._songs = list(songs)

    def __len__(self):
        return len(self._songs)

    def __getitem__(self, i):          # enables indexing, slicing AND iteration
        return self._songs[i]

    def __contains__(self, song):
        return song in self._songs

    def __repr__(self):
        return f"Playlist({self._songs!r})"

p = Playlist(["intro", "verse", "outro"])
print(len(p), p[0], p[-1], "verse" in p)    # 3 intro outro True
for song in p:                               # works via __getitem__
    print(song, end=" ")
```

## Equality, ordering and hashing

```python
from functools import total_ordering

@total_ordering                       # fills in <=, >, >= from __eq__ and __lt__
class Version:
    def __init__(self, major, minor):
        self.major, self.minor = major, minor

    def _key(self):
        return (self.major, self.minor)

    def __eq__(self, other):
        return isinstance(other, Version) and self._key() == other._key()

    def __lt__(self, other):
        return self._key() < other._key()

    def __hash__(self):               # equal objects must hash equally
        return hash(self._key())

versions = sorted([Version(1, 2), Version(1, 0), Version(0, 9)])   # sorted() uses __lt__
print([v._key() for v in versions])                               # [(0, 9), (1, 0), (1, 2)]
print(Version(1, 0) <= Version(1, 2), len({Version(1, 0), Version(1, 0)}))   # True 1
```

> [!WARNING]
> Defining `__eq__` without `__hash__` makes instances **unhashable** (Python sets `__hash__ = None`). If objects are mutable, keep them unhashable — a hash that changes breaks dicts and sets.

### `__lt__` for heaps

`heapq` compares items with `<`, so defining `__lt__` makes custom objects heap-friendly:

```python
import heapq

class Task:
    def __init__(self, priority, name):
        self.priority, self.name = priority, name

    def __lt__(self, other):
        return self.priority < other.priority

pq = [Task(3, "low"), Task(1, "urgent"), Task(2, "normal")]
heapq.heapify(pq)
print(heapq.heappop(pq).name)    # urgent
```

## `__call__`: objects that behave like functions

```python
class Counter:
    def __init__(self):
        self.count = 0

    def __call__(self):
        self.count += 1
        return self.count

tick = Counter()
tick(); tick()
print(tick.count, callable(tick))   # 2 True
```

## `__slots__`: fixed attributes, less memory

```python
class Node:
    __slots__ = ("val", "next")      # no per-instance __dict__

    def __init__(self, val, nxt=None):
        self.val, self.next = val, nxt

n = Node(1)
# n.extra = 5   → AttributeError: 'Node' object has no attribute 'extra'
```

Useful when you create millions of small objects (e.g. graph or linked-list nodes).

> [!INTERVIEW]
> - Python has no true private members; `_x` is a convention and `__x` triggers name mangling.
> - Use `@property` for validation or computed attributes while keeping attribute syntax.
> - If you override `__eq__`, think about `__hash__`.
> - `__repr__` is for developers, `__str__` is for users.

> [!REMEMBER]
> Encapsulate with conventions + properties; implement dunders (`__len__`, `__getitem__`, `__eq__`, `__lt__`, `__hash__`) to make objects feel built-in; add `__slots__` for memory-heavy node classes.
