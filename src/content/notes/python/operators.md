Operators are where many "gotcha" interview questions live: floor division with negatives, short-circuiting, chained comparisons and `is` vs `==`.

## Arithmetic operators

| Operator | Meaning | Example | Result |
|---|---|---|---|
| `+` | addition | `7 + 2` | `9` |
| `-` | subtraction | `7 - 2` | `5` |
| `*` | multiplication | `7 * 2` | `14` |
| `/` | true division (always float) | `7 / 2` | `3.5` |
| `//` | floor division | `7 // 2` | `3` |
| `%` | modulo (sign of divisor) | `7 % 3` | `1` |
| `**` | power | `2 ** 10` | `1024` |

```python
print(-7 // 2, -7 % 2)     # floor toward -inf
print(7 // -2, 7 % -2)
print(divmod(17, 5))       # (quotient, remainder)
print(pow(2, 10, 1000))    # modular exponentiation: 1024 % 1000
```

```output
-4 1
-4 -1
(3, 2)
24
```

> [!WARNING]
> In Python, `//` floors toward negative infinity and `%` takes the sign of the divisor. In C/Java, `-7 / 2 == -3`. If you need C-style truncation use `int(a / b)` (fine for moderate sizes) or `math.trunc`.

The identity `a == (a // b) * b + (a % b)` always holds.

## Comparison operators and chaining

`==`, `!=`, `<`, `<=`, `>`, `>=` return `bool`. Python allows **chaining**:

```python
x = 5
print(1 < x < 10)          # same as 1 < x and x < 10
print(1 < x > 3)           # legal: (1 < x) and (x > 3)
print("apple" < "banana")  # lexicographic comparison
print([1, 2, 3] < [1, 3])  # element-wise, left to right
```

```output
True
True
True
True
```

Each operand in a chain is evaluated **at most once**.

## Logical operators and short-circuiting

`and`, `or`, `not`. `and` / `or` return **one of the operands**, not necessarily a `bool`:

```python
print(0 or "default")    # 'default' — first truthy value
print("a" and "b")       # 'b' — last value if all truthy
print([] and 1 / 0)      # [] — right side never evaluated
print(not [])            # True
```

Short-circuiting is useful for safe guards:

```python
if node is not None and node.val > 0:   # node.val only checked when node exists
    ...
name = user_input or "anonymous"         # fallback value
```

> [!WARNING]
> `x or default` treats *every* falsy value as missing — `0` and `""` included. If `0` is valid, write `x if x is not None else default`.

## Assignment operators

```python
n = 10
n += 5    # 15
n -= 3    # 12
n *= 2    # 24
n //= 5   # 4
n **= 3   # 64
n %= 10   # 4
```

For mutable objects `+=` mutates in place (`list.__iadd__`), which matters when two names share a list:

```python
a = [1]
b = a
a += [2]      # in-place: b sees it
a = a + [3]   # new list: b does not see it
print(a, b)   # [1, 2, 3] [1, 2]
```

### The walrus operator `:=` (Python 3.8+)

Assigns *and* returns a value inside an expression:

```python
import re
if (m := re.search(r"\d+", "order 42")):
    print(m.group())          # 42

while (line := input()) != "quit":
    print(line.upper())
```

## Bitwise operators

| Operator | Meaning | `5 op 3` |
|---|---|---|
| `&` | AND | `1` |
| `\|` | OR | `7` |
| `^` | XOR | `6` |
| `~` | NOT (`~x == -x - 1`) | `~5 == -6` |
| `<<` | left shift (× 2ⁿ) | `5 << 1 == 10` |
| `>>` | right shift (floor ÷ 2ⁿ) | `5 >> 1 == 2` |

```python
x = 0b1011
print(x & 1)          # odd check → 1
print(x & (x - 1))    # clear lowest set bit → 0b1010 = 10
print(bin(x), x.bit_count())   # '0b1011' 3   (bit_count: Python 3.10+)
```

See **DSA › Bit Manipulation** for the full trick list.

## Identity and membership

```python
a = [1, 2]
b = [1, 2]
print(a == b, a is b)      # True False — equal values, different objects
print(None is None)        # True — None is a singleton

print(3 in [1, 2, 3])      # list: O(n) scan
print(3 in {1, 2, 3})      # set: O(1) average
print("ell" in "hello")    # substring check
print("a" in {"a": 1})     # dict: checks KEYS
```

## Operator precedence (high → low)

| Precedence | Operators |
|---|---|
| 1 | `()` parentheses |
| 2 | `**` (right-associative) |
| 3 | unary `+x`, `-x`, `~x` |
| 4 | `*`, `/`, `//`, `%` |
| 5 | `+`, `-` |
| 6 | `<<`, `>>` |
| 7 | `&` |
| 8 | `^` |
| 9 | `\|` |
| 10 | comparisons, `in`, `not in`, `is`, `is not` |
| 11 | `not` |
| 12 | `and` |
| 13 | `or` |
| 14 | `if … else` (conditional expression) |
| 15 | `:=` |

```python
print(-2 ** 2)     # -4  → -(2 ** 2)
print(2 ** 3 ** 2) # 512 → 2 ** 9 (right-associative)
print(1 + 2 & 3)   # 3   → (1 + 2) & 3
```

> [!TIP]
> When in doubt, add parentheses. Readability beats memorising the table — especially with bitwise operators, which bind *looser* than `+`.

> [!INTERVIEW]
> - `-7 // 2 == -4` and `-7 % 2 == 1` in Python.
> - `and`/`or` return operands, enabling idioms like `x = a or b`.
> - `is` checks identity; never use it to compare numbers or strings.
> - `x in set` / `x in dict` is O(1) average; `x in list` is O(n).

> [!REMEMBER]
> Floor division floors toward −∞, comparisons can be chained, logical operators short-circuit and return operands, and `**` is right-associative with higher precedence than unary minus.
