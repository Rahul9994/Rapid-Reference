Python is a high-level, dynamically typed, interpreted language that prioritises readability. In interviews it shines because you can express an algorithm in very few lines — but you still need to understand what happens under the hood.

## How Python runs your code

When you run `python app.py`, CPython (the reference implementation) does two things:

1. **Compiles** your source to *bytecode* (`.pyc` files cached in `__pycache__`).
2. **Interprets** that bytecode on the Python Virtual Machine, one instruction at a time.

```diagram How CPython executes a script
 app.py ──► compiler ──► bytecode (.pyc) ──► Python Virtual Machine ──► output
```

- **Interpreted + compiled**: there is a compile step, but no separate binary like C.
- **Dynamically typed**: types are checked at runtime, not compile time.
- **Strongly typed**: Python will not silently convert `"3" + 4` — it raises `TypeError`.
- **Garbage collected**: memory is managed with reference counting plus a cycle detector.

> [!NOTE]
> "Python is slow" mostly means *pure-Python loops* are slow. Built-ins like `sum`, `sorted`, `str.join` and `collections` are implemented in C and are fast.

## Your first program

```python
print("Hello, Rapid_Reference!")

name = "Ada"
print(f"Hi {name}, 2 + 3 = {2 + 3}")
```

```output
Hello, Rapid_Reference!
Hi Ada, 2 + 3 = 5
```

Key syntax rules:

- **Indentation is syntax.** Blocks are defined by indentation (4 spaces by convention), not braces.
- **No semicolons** needed at line ends.
- `#` starts a comment; triple-quoted strings are used for docstrings.

```python
def greet(name):
    """Return a greeting for name."""   # docstring
    if name:                            # 4-space indent = new block
        return f"Hello, {name}"
    return "Hello, stranger"
```

## Variables are names bound to objects

In Python a variable is **a name that refers to an object**. Assignment never copies data; it binds a name.

```python
a = [1, 2, 3]
b = a          # b refers to the SAME list object
b.append(4)
print(a)       # a sees the change
print(a is b)  # same identity?
```

```output
[1, 2, 3, 4]
True
```

```diagram Two names, one object
  a ──┐
      ├──► [1, 2, 3, 4]   (one list object in memory)
  b ──┘
```

Every object has three things:

| Property | How to inspect | Can it change? |
|---|---|---|
| Identity | `id(obj)` | Never (for the object's lifetime) |
| Type | `type(obj)` | Never |
| Value | the object itself | Only if the type is *mutable* |

### Multiple assignment and swapping

```python
x, y = 10, 20        # tuple unpacking
x, y = y, x          # swap without a temp variable
a = b = c = 0        # chain: all three names refer to the same 0
first, *rest = [1, 2, 3, 4]   # extended unpacking
print(x, y, first, rest)
```

```output
20 10 1 [2, 3, 4]
```

## Naming rules and conventions

- Names may contain letters, digits and `_`, but **cannot start with a digit**.
- Names are **case-sensitive** (`count` ≠ `Count`).
- You cannot use keywords (`if`, `class`, `lambda`, `None`, …) as names.

| Kind | Convention (PEP 8) | Example |
|---|---|---|
| Variables, functions | `snake_case` | `max_sum`, `find_path()` |
| Classes | `PascalCase` | `LinkedList` |
| Constants | `UPPER_SNAKE` | `MOD = 10**9 + 7` |
| "Private" by convention | leading `_` | `_cache` |

```python
import keyword
print(len(keyword.kwlist), keyword.iskeyword("lambda"))
```

## Mutable vs immutable objects

This single idea explains a huge number of Python bugs.

| Immutable | Mutable |
|---|---|
| `int`, `float`, `bool`, `complex` | `list` |
| `str`, `bytes` | `dict` |
| `tuple`, `frozenset` | `set`, `bytearray` |
| `None` | most user-defined objects |

"Changing" an immutable object actually creates a **new** object and rebinds the name:

```python
s = "hi"
print(id(s))
s += "!"        # creates a new string object
print(id(s))    # different id

nums = [1, 2]
print(id(nums))
nums += [3]     # list is mutated in place
print(id(nums)) # same id
```

> [!WARNING]
> - Using `is` to compare values: `x is 1000` may be `False` even when `x == 1000`. Use `==` for values, `is` only for `None` / identity checks.
> - Assuming `b = a` copies a list. It doesn't — use `a.copy()`, `a[:]` or `copy.deepcopy(a)`.

## Dynamic typing in practice

A name can be rebound to an object of any type:

```python
x = 5          # int
x = "five"     # now a str — perfectly legal
print(type(x)) # <class 'str'>
```

Type hints document intent but are **not enforced** at runtime:

```python
def area(r: float) -> float:
    return 3.14159 * r * r

print(area("2"))   # runs until 3.14159 * "2" → TypeError: can't multiply sequence by non-int of type 'float'
```

## The REPL and quick introspection

```python
>>> help(str.split)       # documentation
>>> dir([])               # list of attributes/methods
>>> type(3.0), id(3.0)
>>> isinstance(True, int) # True — bool is a subclass of int
```

> [!INTERVIEW]
> - *"Is Python compiled or interpreted?"* — Both: source is compiled to bytecode, which the PVM interprets.
> - *"What does `a = b` do?"* — It binds name `a` to the same object `b` refers to; nothing is copied.
> - *"Difference between `is` and `==`?"* — `is` compares identity (same object), `==` compares values via `__eq__`.

> [!REMEMBER]
> Names point to objects. Immutable objects can't change, so "modifying" them makes a new object; mutable objects change in place and every name pointing at them sees the change.
