Conditionals choose which code runs. Python keeps them minimal: `if / elif / else`, a one-line conditional expression, and (since 3.10) structural pattern matching with `match`.

## if / elif / else

```python
score = 82

if score >= 90:
    grade = "A"
elif score >= 75:
    grade = "B"
elif score >= 60:
    grade = "C"
else:
    grade = "F"

print(grade)   # B
```

- Conditions are checked **top to bottom**; the first true branch runs and the rest are skipped.
- `elif` and `else` are optional. There is no `switch` statement.
- An empty block needs `pass`.

```python
if user_is_admin:
    pass          # TODO — placeholder keeps syntax valid
```

## Truthiness in conditions

Any object can be tested. Prefer the idiomatic forms:

| Instead of | Write |
|---|---|
| `if len(items) > 0:` | `if items:` |
| `if len(items) == 0:` | `if not items:` |
| `if flag == True:` | `if flag:` |
| `if x == None:` | `if x is None:` |

> [!WARNING]
> `if x:` is false for `0`, `""`, `[]` *and* `None`. When `0` is a valid value (an index, a count), test explicitly: `if x is not None:`.

## Conditional (ternary) expression

`value_if_true if condition else value_if_false`

```python
n = 7
parity = "even" if n % 2 == 0 else "odd"
abs_n = n if n >= 0 else -n
print(parity, abs_n)   # odd 7
```

Nesting is possible but quickly unreadable — use `if/elif` instead:

```python
sign = "pos" if n > 0 else "neg" if n < 0 else "zero"
```

## Combining conditions

```python
age, has_id = 20, True

if age >= 18 and has_id:
    print("allowed")

if not (0 <= age <= 120):
    print("invalid age")

# any / all for collections
nums = [2, 4, 6]
if all(x % 2 == 0 for x in nums):
    print("all even")
if any(x > 5 for x in nums):
    print("something > 5")
```

## Structural pattern matching (`match`, Python 3.10+)

`match` compares a value against **patterns**, not just constants.

```python
def http_status(code):
    match code:
        case 200 | 201:
            return "OK"
        case 404:
            return "Not Found"
        case 500 | 502 | 503:
            return "Server Error"
        case _:
            return "Unknown"      # _ is the wildcard (default)

print(http_status(201), http_status(418))   # OK Unknown
```

Patterns can destructure sequences and mappings, and add guards:

```python
def describe(point):
    match point:
        case (0, 0):
            return "origin"
        case (0, y):
            return f"on y-axis at {y}"
        case (x, 0):
            return f"on x-axis at {x}"
        case (x, y) if x == y:
            return "on the diagonal"
        case (x, y):
            return f"point {x},{y}"

print(describe((0, 5)), "|", describe((3, 3)))
```

```output
on y-axis at 5 | on the diagonal
```

```python
command = {"action": "move", "dx": 1, "dy": -1}
match command:
    case {"action": "move", "dx": dx, "dy": dy}:
        print("moving", dx, dy)
    case {"action": "quit"}:
        print("bye")
```

> [!NOTE]
> A bare name in a `case` pattern **captures** the value — it does not compare against an existing variable. To compare with a constant, use a dotted name (`case Color.RED:`) or a literal.

## Dictionary dispatch (alternative to long if-chains)

```python
import operator

ops = {"+": operator.add, "-": operator.sub, "*": operator.mul, "/": operator.truediv}

def calc(a, op, b):
    func = ops.get(op)
    if func is None:
        raise ValueError(f"unknown operator {op!r}")
    return func(a, b)

print(calc(6, "*", 7))   # 42
```

## Guard clauses (early return)

Flatten deeply nested conditionals by returning early:

```python
def discount(user):
    if user is None:
        return 0
    if not user.is_member:
        return 5
    if user.years > 3:
        return 20
    return 10
```

> [!INTERVIEW]
> - Python has no `switch`; use `if/elif`, dict dispatch, or `match` (3.10+).
> - Know the falsy values: `None, False, 0, 0.0, '', [], (), {}, set(), range(0)`.
> - `a if cond else b` is an *expression* — it produces a value and can be used inline.

> [!REMEMBER]
> Use truthiness for emptiness checks, `is None` for None checks, guard clauses to reduce nesting, and `match` when you need to destructure data.
