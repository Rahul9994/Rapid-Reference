A decorator is a function that takes a function and returns a new function with extra behaviour — logging, timing, caching, access checks — without changing the original code.

## Building blocks: closures

Functions can be nested, and inner functions **remember** variables from the enclosing scope:

```python
def make_greeter(greeting):
    def greet(name):
        return f"{greeting}, {name}!"   # 'greeting' is captured
    return greet

hello = make_greeter("Hello")
print(hello("Ada"))                      # Hello, Ada!
print(hello.__closure__[0].cell_contents)  # Hello
```

## Your first decorator

```python
def shout(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        return result.upper()
    return wrapper

@shout                     # same as: greet = shout(greet)
def greet(name):
    return f"hi {name}"

print(greet("ada"))        # HI ADA
```

```diagram What @decorator does
 @shout
 def greet(...): ...      ≡      greet = shout(greet)

 call greet("ada") ──► wrapper("ada") ──► original greet("ada") ──► .upper()
```

## Always use functools.wraps

Without it, the wrapper hides the original function's name and docstring:

```python
import functools
import time

def timed(func):
    @functools.wraps(func)          # copy __name__, __doc__, etc.
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        try:
            return func(*args, **kwargs)
        finally:
            elapsed = (time.perf_counter() - start) * 1000
            print(f"{func.__name__} took {elapsed:.2f} ms")
    return wrapper

@timed
def slow_sum(n):
    """Sum 0..n-1."""
    return sum(range(n))

slow_sum(10**6)
print(slow_sum.__name__, slow_sum.__doc__)   # slow_sum Sum 0..n-1.
```

## Decorators with arguments

Add one more layer: a function that **returns a decorator**.

```python
import functools

def retry(times=3, exceptions=(Exception,)):
    def decorator(func):
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(1, times + 1):
                try:
                    return func(*args, **kwargs)
                except exceptions as e:
                    print(f"attempt {attempt} failed: {e}")
            raise RuntimeError(f"{func.__name__} failed after {times} attempts")
        return wrapper
    return decorator

calls = {"n": 0}

@retry(times=3, exceptions=(ValueError,))
def flaky():
    calls["n"] += 1
    if calls["n"] < 3:
        raise ValueError("not yet")
    return "ok"

print(flaky())
```

```output
attempt 1 failed: not yet
attempt 2 failed: not yet
ok
```

## Stacking decorators

Decorators apply **bottom-up** (closest to the function first), and run **top-down** when called:

```python
def bold(f):
    return lambda: f"<b>{f()}</b>"

def italic(f):
    return lambda: f"<i>{f()}</i>"

@bold
@italic
def text():
    return "hi"

print(text())    # <b><i>hi</i></b>  — text = bold(italic(text))
```

## Decorators that keep state

```python
import functools

def count_calls(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        wrapper.calls += 1
        return func(*args, **kwargs)
    wrapper.calls = 0
    return wrapper

@count_calls
def ping():
    return "pong"

ping(); ping()
print(ping.calls)   # 2
```

## A memoization decorator (what lru_cache does)

```python
import functools

def memoize(func):
    cache = {}
    @functools.wraps(func)
    def wrapper(*args):
        if args not in cache:
            cache[args] = func(*args)
        return cache[args]
    return wrapper

@memoize
def grid_paths(r, c):
    if r == 0 or c == 0:
        return 1
    return grid_paths(r - 1, c) + grid_paths(r, c - 1)

print(grid_paths(16, 16))   # 601080390
```

In practice use the built-in:

```python
from functools import lru_cache, cache

@cache                      # unbounded (3.9+); lru_cache(maxsize=None) is equivalent
def ways(n):
    return 1 if n <= 1 else ways(n - 1) + ways(n - 2)

print(ways(50), ways.cache_info().hits > 0)
```

## Built-in decorators you should know

| Decorator | Purpose |
|---|---|
| `@property`, `@x.setter` | managed attributes |
| `@classmethod`, `@staticmethod` | alternative method types |
| `@functools.lru_cache`, `@functools.cache` | memoization |
| `@functools.wraps` | preserve metadata in decorators |
| `@functools.total_ordering` | derive comparisons from `__eq__` + one ordering method |
| `@dataclasses.dataclass` | generate `__init__`, `__repr__`, `__eq__` |
| `@abc.abstractmethod` | declare abstract methods |
| `@contextlib.contextmanager` | build context managers from generators |

## Class decorators

A decorator can also receive and return a class:

```python
registry = {}

def register(cls):
    registry[cls.__name__] = cls
    return cls

@register
class Plugin:
    pass

print(registry)   # {'Plugin': <class '__main__.Plugin'>}
```

> [!WARNING]
> - Forgetting `return wrapper` (or `return func(...)` inside the wrapper) makes the decorated function return `None`.
> - Forgetting `@functools.wraps` breaks introspection, docs and some frameworks.
> - `@retry` vs `@retry()`: a decorator factory must be called, even with no arguments.

> [!INTERVIEW]
> - A decorator is syntactic sugar for `f = deco(f)`; it relies on closures and first-class functions.
> - Decorators with arguments need three levels: factory → decorator → wrapper.
> - Use cases: logging, timing, caching, authentication, retries, registration.

> [!REMEMBER]
> `wrapper(*args, **kwargs)` + `@functools.wraps(func)` + return the wrapper. Add an outer layer for arguments. Stacked decorators apply bottom-up.
