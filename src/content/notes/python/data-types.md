Every value in Python is an object with a type. Knowing the built-in types — and their quirks — prevents a whole class of interview bugs.

## Built-in types at a glance

| Category | Types | Mutable? |
|---|---|---|
| Numeric | `int`, `float`, `complex` | No |
| Boolean | `bool` (subclass of `int`) | No |
| Text | `str` | No |
| Sequence | `list`, `tuple`, `range` | list: yes, others: no |
| Mapping | `dict` | Yes |
| Set | `set`, `frozenset` | set: yes |
| Binary | `bytes`, `bytearray` | bytearray: yes |
| Null | `NoneType` (`None`) | No |

```python
for v in [42, 3.14, 2 + 3j, True, "hi", [1], (1,), {1}, {"a": 1}, None]:
    print(type(v).__name__, end=" ")
```

```output
int float complex bool str list tuple set dict NoneType 
```

## Integers: arbitrary precision

Python `int` never overflows — it grows as needed. This is why Python is great for big-number problems.

```python
print(2 ** 100)
print(10**18 + 1)
print(0b1010, 0o17, 0xFF)   # binary, octal, hex literals
print(1_000_000)            # underscores for readability
```

```output
1267650600228229401496703205376
1000000000000000001
10 15 255
1000000
```

> [!TIP]
> Big integers aren't free: arithmetic on huge numbers costs more than O(1). In modular problems, reduce often: `ans = (ans * x) % MOD`.

## Floats: binary approximations

`float` is an IEEE-754 double. Many decimals can't be represented exactly.

```python
print(0.1 + 0.2)
print(0.1 + 0.2 == 0.3)

import math
print(math.isclose(0.1 + 0.2, 0.3))
print(float("inf") > 10**308, float("nan") == float("nan"))
```

```output
0.30000000000000004
False
True
True False
```

- Use `math.isclose()` for float comparison.
- Use `decimal.Decimal` for money, `fractions.Fraction` for exact rationals.
- `float('inf')` / `-float('inf')` (or `math.inf`) are handy as initial min/max values.

## Booleans and truthiness

`True` and `False` are integers `1` and `0` in disguise:

```python
print(True + True, isinstance(False, int))   # 2 True
print(sum([True, False, True]))              # count of True → 2
```

**Falsy values**: `False`, `None`, `0`, `0.0`, `0j`, `""`, `[]`, `()`, `{}`, `set()`, `range(0)`. Everything else is truthy.

```python
items = []
if not items:
    print("empty")      # idiomatic emptiness check
```

## Strings, None and complex (quick look)

```python
s = "Python"
print(s[0], s[-1], len(s))   # P n 6

result = None                # "no value yet"
if result is None:           # always compare None with `is`
    print("not computed")

z = 3 + 4j
print(abs(z), z.real, z.imag) # 5.0 3.0 4.0
```

## Type checking

```python
x = 5
print(type(x) == int)          # exact type check
print(isinstance(x, int))      # preferred: respects inheritance
print(isinstance(x, (int, float)))  # tuple of types
print(isinstance(True, int))   # True! bool is a subclass of int
```

> [!WARNING]
> `isinstance(True, int)` is `True`. If you need to exclude booleans, check `type(x) is int` or test `isinstance(x, bool)` first.

## Type conversion (casting)

**Implicit conversion** happens only between numeric types:

```python
print(3 + 4.5)      # int + float → float 7.5
print(True + 2)     # bool → int → 3
```

**Explicit conversion** uses the type as a function:

| Call | Result | Notes |
|---|---|---|
| `int("42")` | `42` | strips surrounding whitespace |
| `int("ff", 16)` | `255` | any base 2–36 |
| `int(3.99)` | `3` | truncates toward zero |
| `int(-3.99)` | `-3` | truncation, *not* floor |
| `float("1e3")` | `1000.0` | |
| `str(3.0)` | `'3.0'` | |
| `bool("False")` | `True` | non-empty string is truthy! |
| `list("abc")` | `['a', 'b', 'c']` | any iterable |
| `tuple([1, 2])` | `(1, 2)` | |
| `set([1, 1, 2])` | `{1, 2}` | removes duplicates |
| `ord("a")`, `chr(97)` | `97`, `'a'` | char ↔ code point |

```python
print(int("  12  "), int("1010", 2), round(2.5), round(3.5))
```

```output
12 10 2 4
```

> [!IMPORTANT]
> `round()` uses **banker's rounding** (round half to even): `round(2.5) == 2`, `round(3.5) == 4`. For classic rounding use `math.floor(x + 0.5)` for positives or the `decimal` module.

## Checking numeric strings

```python
print("123".isdigit(), "-5".isdigit(), "3.5".isdigit())   # True False False

def to_int(s):
    try:
        return int(s)
    except ValueError:
        return None
```

> [!INTERVIEW]
> - Python ints have **arbitrary precision** — no overflow (unlike C/Java).
> - `0.1 + 0.2 != 0.3` because floats are binary approximations.
> - `bool` is a subclass of `int`; `True == 1`.
> - `int(-3.7)` is `-3` (truncation) while `math.floor(-3.7)` is `-4` and `-7 // 2` is `-4`.

> [!REMEMBER]
> Immutable scalars: `int`, `float`, `bool`, `str`, `tuple`, `None`. Compare floats with `math.isclose`, compare `None` with `is`, and remember `round()` rounds half to even.
