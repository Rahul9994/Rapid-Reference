Exceptions signal that something went wrong at runtime. Python encourages handling them explicitly — "it's easier to ask forgiveness than permission" (EAFP).

## try / except / else / finally

```python
def safe_divide(a, b):
    try:
        result = a / b
    except ZeroDivisionError:
        print("cannot divide by zero")
        return None
    except TypeError as e:
        print("bad types:", e)
        return None
    else:
        print("no exception happened")   # runs only if try succeeded
        return result
    finally:
        print("always runs (cleanup)")   # runs no matter what

print(safe_divide(10, 2))
```

```output
no exception happened
always runs (cleanup)
5.0
```

| Block | Runs when |
|---|---|
| `try` | always (first) |
| `except` | a matching exception was raised in `try` |
| `else` | `try` finished **without** an exception |
| `finally` | always — even after `return`, `break` or an unhandled error |

Catch several types at once with a tuple:

```python
try:
    value = int(input())
except (ValueError, EOFError):
    value = 0
```

## The exception hierarchy

```diagram Partial built-in exception tree
BaseException
 ├── SystemExit, KeyboardInterrupt, GeneratorExit
 └── Exception
      ├── ArithmeticError ── ZeroDivisionError, OverflowError
      ├── LookupError ────── IndexError, KeyError
      ├── ValueError ─────── UnicodeError
      ├── TypeError
      ├── AttributeError
      ├── NameError ──────── UnboundLocalError
      ├── OSError ────────── FileNotFoundError, PermissionError
      ├── RuntimeError ───── RecursionError, NotImplementedError
      └── StopIteration
```

Catching a parent catches all children: `except LookupError` handles both `IndexError` and `KeyError`.

> [!WARNING]
> - A bare `except:` (or `except BaseException`) also swallows `KeyboardInterrupt` and `SystemExit` — you can't Ctrl-C out. Catch `Exception` at most, ideally something specific.
> - Order matters: put specific `except` clauses before general ones, or the general one wins.

## Raising exceptions

```python
def withdraw(balance, amount):
    if amount <= 0:
        raise ValueError(f"amount must be positive, got {amount}")
    if amount > balance:
        raise RuntimeError("insufficient funds")
    return balance - amount
```

Re-raise the current exception with a bare `raise`, or chain a new one with `from`:

```python
import json

def load_config(text):
    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError("config is not valid JSON") from e   # keeps the original cause
```

## Custom exceptions

```python
class InsufficientFunds(Exception):
    """Raised when a withdrawal exceeds the balance."""

    def __init__(self, balance, amount):
        super().__init__(f"need {amount}, have {balance}")
        self.balance = balance
        self.amount = amount

try:
    raise InsufficientFunds(50, 80)
except InsufficientFunds as e:
    print(e, "| short by", e.amount - e.balance)
```

```output
need 80, have 50 | short by 30
```

Inherit from `Exception` (not `BaseException`). Group related errors under a common base class for your module.

## EAFP vs LBYL

```python
d = {"a": 1}

# LBYL — Look Before You Leap
if "b" in d:
    value = d["b"]
else:
    value = 0

# EAFP — Easier to Ask Forgiveness than Permission (Pythonic)
try:
    value = d["b"]
except KeyError:
    value = 0
```

EAFP avoids race conditions (e.g. a file deleted between "exists?" and "open") and double lookups. For simple cases, `d.get("b", 0)` beats both.

## Context managers and `with`

`with` guarantees cleanup — it's `try/finally` in a reusable form:

```python
with open("notes.txt", "w") as f:
    f.write("hello")
# file is closed here, even if write() raised
```

Write your own with `contextlib.contextmanager`:

```python
from contextlib import contextmanager
import time

@contextmanager
def timer(label):
    start = time.perf_counter()
    try:
        yield
    finally:
        print(f"{label}: {time.perf_counter() - start:.4f}s")

with timer("sum"):
    sum(range(10**6))
```

Or a class with `__enter__` / `__exit__`. Suppress specific errors cleanly:

```python
from contextlib import suppress
import os

with suppress(FileNotFoundError):
    os.remove("maybe_missing.tmp")
```

## assert

`assert condition, message` raises `AssertionError` when false. Use it for **internal invariants and tests**, never for validating user input — asserts are removed when Python runs with `-O`.

```python
def binary_search(nums, target):
    assert nums == sorted(nums), "input must be sorted"
    ...
```

## Exception groups (Python 3.11+)

```python
try:
    raise ExceptionGroup("batch failed", [ValueError("bad"), TypeError("worse")])
except* ValueError as eg:
    print("value errors:", eg.exceptions)
except* TypeError as eg:
    print("type errors:", eg.exceptions)
```

> [!INTERVIEW]
> - `else` runs only when no exception occurred; `finally` always runs.
> - `raise ... from e` preserves the original traceback as `__cause__`.
> - Custom exceptions should subclass `Exception`.
> - EAFP (try/except) is preferred over LBYL in idiomatic Python.

> [!REMEMBER]
> Catch specific exceptions, keep `try` blocks small, clean up with `with`/`finally`, chain with `from`, and never use a bare `except:`.
