## What is the difference between a list and a tuple in Python?

- **Mutability**: lists are mutable (add/remove/change items); tuples are immutable.
- **Hashability**: tuples of hashable items are hashable, so they can be **dict keys** or **set members**; lists can't.
- **Performance/memory**: tuples are slightly smaller and faster to create.
- **Intent**: list → a changing collection of similar items; tuple → a fixed record like `(x, y)` or multiple return values.

```python
point = (3, 4)            # fixed record
visited = {point}         # OK: tuple is hashable
items = [1, 2]; items.append(3)
```

## Is Python compiled or interpreted?

Both. CPython **compiles** source code to **bytecode** (`.pyc` in `__pycache__`), which is then **interpreted** by the Python Virtual Machine. There's no separate machine-code binary like C. Other implementations (PyPy) add a JIT compiler.

## What is the difference between `is` and `==`?

`==` compares **values** (calls `__eq__`); `is` compares **identity** (same object in memory). Use `is` only for singletons like `None`:

```python
a = [1, 2]; b = [1, 2]
print(a == b, a is b)   # True False
if x is None: ...
```

## What are mutable and immutable types?

Immutable objects can't change after creation: `int`, `float`, `bool`, `str`, `tuple`, `frozenset`, `bytes`. Mutable ones can: `list`, `dict`, `set`, `bytearray`, most user objects. "Modifying" an immutable value creates a new object and rebinds the name; mutating a mutable object is visible through every name referring to it.

## How are arguments passed to functions in Python?

By **assignment** (often called "pass by object reference"): the parameter becomes a new name bound to the same object. Mutating a mutable argument affects the caller; **rebinding** the parameter doesn't.

```python
def f(lst):
    lst.append(1)   # caller sees this
    lst = [99]      # caller does NOT see this
```

## What is the mutable default argument problem?

Default values are evaluated **once**, at function definition time, so a mutable default is shared across calls:

```python
def add(x, items=[]):      # ❌ same list every call
    items.append(x); return items

def add(x, items=None):    # ✅
    items = [] if items is None else items
    items.append(x); return items
```

## What are `*args` and `**kwargs`?

`*args` collects extra **positional** arguments into a tuple; `**kwargs` collects extra **keyword** arguments into a dict. At call sites, `*` and `**` unpack sequences and mappings.

```python
def f(*args, **kwargs):
    print(args, kwargs)
f(1, 2, a=3)   # (1, 2) {'a': 3}
```

## Explain shallow copy vs deep copy.

A **shallow copy** creates a new outer container but shares the nested objects; a **deep copy** recursively copies everything.

```python
import copy
a = [[1, 2], [3]]
s = a.copy(); d = copy.deepcopy(a)
a[0].append(9)
print(s[0], d[0])   # [1, 2, 9] [1, 2]
```

## What is the GIL?

The **Global Interpreter Lock** is a mutex in CPython that allows only one thread to execute Python bytecode at a time. Consequences: threads don't speed up **CPU-bound** pure-Python code (use `multiprocessing` or native extensions), but they do help **I/O-bound** work because the GIL is released while waiting on I/O. (Experimental free-threaded builds without the GIL exist since Python 3.13.)

## What are decorators?

Functions that take a function and return a new function with added behaviour (logging, timing, caching, auth). `@deco` above `def f` is shorthand for `f = deco(f)`. Use `functools.wraps` to preserve the original name and docstring.

```python
import functools
def logged(fn):
    @functools.wraps(fn)
    def wrapper(*a, **k):
        print("calling", fn.__name__)
        return fn(*a, **k)
    return wrapper
```

## What are generators and why use them?

Functions that use `yield` to produce values **lazily**, one at a time, keeping their state between calls. They save memory (no full list), can represent infinite sequences, and enable streaming pipelines. Generator expressions `(x*x for x in data)` are the inline form.

## Iterator vs iterable?

An **iterable** can return an iterator (`__iter__`): lists, strings, dicts, files. An **iterator** produces values with `__next__` and raises `StopIteration` when exhausted; it's single-pass. `for` loops call `iter()` on the iterable and `next()` repeatedly.

## What is a lambda function?

An anonymous single-expression function: `lambda x: x * 2`. Commonly used as a `key=` for `sorted`, `min`, `max`. For anything named or multi-step, prefer `def`.

## How are dictionaries implemented and what's their complexity?

As **hash tables**: keys are hashed to find slots (CPython uses open addressing). Average **O(1)** lookup, insert and delete; worst case O(n) with many collisions. Keys must be hashable. Since Python 3.7, dicts preserve insertion order.

## What's the difference between `append()` and `extend()`?

`append(x)` adds `x` as a **single** element; `extend(iterable)` adds **each** element of the iterable.

```python
a = [1]; a.append([2, 3])   # [1, [2, 3]]
b = [1]; b.extend([2, 3])   # [1, 2, 3]
```

## What are `@staticmethod` and `@classmethod`?

A **classmethod** receives the class (`cls`) — used for alternative constructors/factories. A **staticmethod** receives neither instance nor class — a utility function namespaced in the class. Regular methods receive the instance (`self`).

## How do you handle exceptions in Python?

With `try / except / else / finally`. Catch **specific** exceptions, keep the `try` block small, use `else` for code that runs only on success and `finally` (or `with`) for cleanup. Raise custom exceptions by subclassing `Exception`, and chain with `raise ... from e`.

## What is the difference between `range` in Python 3 and a list?

`range` is a **lazy**, immutable sequence: it stores only start/stop/step and computes values on demand, so `range(10**9)` uses constant memory. It supports `len`, indexing, slicing and O(1) membership tests for integers.

## What is list comprehension? Is it faster than a loop?

A concise way to build lists: `[x * x for x in nums if x > 0]`. It's usually faster than an equivalent `for` loop with `append` because the loop runs in optimised bytecode without repeated method lookups. Don't use it for side effects.

## What does `if __name__ == "__main__":` do?

It runs the block only when the file is executed directly (`python file.py`), not when it's imported as a module — letting a file act as both a reusable module and a script.

## How does Python manage memory?

Through **reference counting** (objects are freed when their count drops to zero) plus a **cyclic garbage collector** for reference cycles. Small objects use a specialised allocator (pymalloc). Small integers and some strings are cached/interned.
