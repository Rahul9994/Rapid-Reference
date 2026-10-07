Functions package reusable logic. In Python they are **first-class objects**: you can pass them around, return them and store them in data structures.

## Defining and calling

```python
def add(a, b):
    """Return the sum of a and b."""
    return a + b

print(add(2, 3))     # 5
print(add.__doc__)   # Return the sum of a and b.
```

- A function without `return` (or with a bare `return`) returns `None`.
- Return multiple values as a tuple: `return lo, hi` → `lo, hi = f()`.

## Parameters and arguments

```python
def greet(name, greeting="Hello", *, punctuation="!"):
    return f"{greeting}, {name}{punctuation}"

print(greet("Ada"))                       # positional
print(greet("Ada", "Hi"))                 # positional default override
print(greet(greeting="Hey", name="Alan")) # keyword arguments
print(greet("Ada", punctuation="?"))      # keyword-only parameter
```

### Full parameter grammar

```python
def f(pos_only, /, normal, *args, kw_only, **kwargs):
    print(pos_only, normal, args, kw_only, kwargs)

f(1, 2, 3, 4, kw_only=5, extra=6)
```

```output
1 2 (3, 4) 5 {'extra': 6}
```

| Syntax | Meaning |
|---|---|
| `a, b` | positional-or-keyword |
| `/` | parameters before it are **positional-only** (3.8+) |
| `*args` | extra positional args collected into a **tuple** |
| `*` (bare) | parameters after it are **keyword-only** |
| `**kwargs` | extra keyword args collected into a **dict** |

### Unpacking when calling

```python
def point(x, y, z):
    return x + y + z

coords = [1, 2, 3]
opts = {"x": 1, "y": 2, "z": 3}
print(point(*coords), point(**opts))   # 6 6
```

## The mutable default argument trap

Default values are evaluated **once**, when the function is defined:

```python
def append_bad(x, items=[]):
    items.append(x)
    return items

print(append_bad(1))   # [1]
print(append_bad(2))   # [1, 2]  ← the same list is reused!

def append_good(x, items=None):
    if items is None:
        items = []
    items.append(x)
    return items
```

> [!WARNING]
> Never use a mutable object (`[]`, `{}`, `set()`) as a default. Use `None` and create the object inside the function.

## Scope: the LEGB rule

Names are resolved in order: **L**ocal → **E**nclosing → **G**lobal → **B**uilt-in.

```python
x = "global"

def outer():
    x = "enclosing"
    def inner():
        x = "local"
        print(x)
    inner()
    print(x)

outer()
print(x)
```

```output
local
enclosing
global
```

### `global` and `nonlocal`

Assigning to a name makes it local — unless you declare otherwise:

```python
count = 0
def increment():
    global count        # rebind the module-level name
    count += 1

def make_counter():
    n = 0
    def inc():
        nonlocal n      # rebind the enclosing function's name
        n += 1
        return n
    return inc

c = make_counter()
print(c(), c(), c())    # 1 2 3
```

> [!WARNING]
> `UnboundLocalError` happens when you read a variable and also assign to it in the same function without `global`/`nonlocal` — the assignment makes it local for the *whole* function.

## Functions are first-class objects

```python
def square(x):
    return x * x

f = square                    # assign
print(f(4))                   # 16
print(list(map(square, [1, 2, 3])))   # pass as argument

def make_multiplier(k):       # return a function
    def mul(x):
        return x * k
    return mul

triple = make_multiplier(3)
print(triple(5))              # 15
```

`make_multiplier` returns a **closure** — `mul` remembers `k` from its enclosing scope.

> [!WARNING]
> Late binding in closures: `[lambda: i for i in range(3)]` — every lambda returns `2`, because `i` is looked up when called. Fix with a default: `lambda i=i: i`.

## Type hints and docstrings

```python
from typing import Optional

def find_index(nums: list[int], target: int) -> Optional[int]:
    """Return the index of target in nums, or None if absent.

    Args:
        nums: list of integers to search.
        target: value to find.
    """
    for i, x in enumerate(nums):
        if x == target:
            return i
    return None
```

Hints are not enforced at runtime, but tools like `mypy` and your editor use them.

## Pure functions and side effects

A pure function depends only on its inputs and doesn't modify outside state — easier to test and memoize. Mutating an argument is a side effect the caller may not expect:

```python
def sorted_copy(nums):
    return sorted(nums)      # pure — leaves nums untouched

def sort_in_place(nums):
    nums.sort()              # side effect — caller's list changes
```

> [!INTERVIEW]
> - Python passes **object references by value** ("pass by assignment"). Mutating a passed list is visible to the caller; rebinding the parameter is not.
> - `*args` is a tuple, `**kwargs` is a dict.
> - Default arguments are evaluated once at definition time.
> - LEGB: Local, Enclosing, Global, Built-in.

> [!REMEMBER]
> Use `None` for mutable defaults, `nonlocal` for closure counters, keyword-only args (`*`) for clarity, and remember functions are objects you can pass and return.
