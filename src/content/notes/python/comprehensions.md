Comprehensions build lists, dicts, sets and generators from iterables in a single, readable expression. They're idiomatic, usually faster than an explicit loop with `append`, and show interviewers you know Python.

## List comprehensions

`[expression for item in iterable if condition]`

```python
squares = [x * x for x in range(6)]
evens = [x for x in range(10) if x % 2 == 0]
words = ["Hi", "there", "Py"]
lengths = [len(w) for w in words]
print(squares, evens, lengths)
```

```output
[0, 1, 4, 9, 16, 25] [0, 2, 4, 6, 8] [2, 5, 2]
```

Equivalent loop:

```python
squares = []
for x in range(6):
    squares.append(x * x)
```

## Conditional expressions inside

Filter (`if` at the end) vs transform (`if/else` in the expression):

```python
nums = [-2, -1, 0, 1, 2]
positives = [x for x in nums if x > 0]               # filter → [1, 2]
clipped = [x if x > 0 else 0 for x in nums]          # map → [0, 0, 0, 1, 2]
labels = ["even" if x % 2 == 0 else "odd" for x in range(4)]
```

## Nested comprehensions

Loops read **left to right, outermost first** — the same order as nested `for` statements:

```python
pairs = [(i, j) for i in range(3) for j in range(i)]
print(pairs)        # [(1, 0), (2, 0), (2, 1)]

matrix = [[1, 2, 3], [4, 5, 6]]
flat = [x for row in matrix for x in row]            # flatten → [1, 2, 3, 4, 5, 6]
transposed = [[row[c] for row in matrix] for c in range(3)]
print(transposed)   # [[1, 4], [2, 5], [3, 6]]

grid = [[0] * 4 for _ in range(3)]                   # 3×4 grid, independent rows
```

## Dict and set comprehensions

```python
names = ["ada", "alan", "grace"]
lengths = {n: len(n) for n in names}                 # {'ada': 3, 'alan': 4, 'grace': 5}
index = {n: i for i, n in enumerate(names)}          # value → position
inverted = {v: k for k, v in lengths.items()}

first_letters = {n[0] for n in names}                # {'a', 'g'}
print(lengths, first_letters)
```

## Generator expressions: lazy comprehensions

Use parentheses to produce values **on demand** instead of building a list:

```python
total = sum(x * x for x in range(1_000_000))   # no million-element list in memory
has_neg = any(x < 0 for x in [3, -1, 4])        # stops at the first True
gen = (c.upper() for c in "abc")
print(next(gen), list(gen))                     # A ['B', 'C']
```

| | List comprehension | Generator expression |
|---|---|---|
| Syntax | `[...]` | `(...)` |
| Memory | O(n) — all items | O(1) — one item at a time |
| Reusable | Yes | No — single pass |
| Indexing / `len` | Yes | No |

## Scope

Comprehension variables don't leak into the surrounding scope (Python 3):

```python
x = "outer"
squares = [x * 2 for x in range(3)]
print(x)    # outer
```

## When NOT to use a comprehension

- When you need side effects only (e.g. printing) — write a normal loop.
- When the logic needs multiple statements or more than two `for`s — readability wins.
- When you'd write `[f(x) for x in it]` just to throw it away.

```python
# ❌ comprehension for side effects
[print(x) for x in range(3)]

# ✅
for x in range(3):
    print(x)
```

## Interview-ready one-liners

```python
words = ["apple", "Bob", "kayak", "level", "Test"]
palins = [w for w in words if w.lower() == w.lower()[::-1]]   # ['Bob', 'kayak', 'level']

from collections import Counter
nums = [1, 2, 2, 3, 3, 3]
dupes = sorted({x for x, c in Counter(nums).items() if c > 1})   # [2, 3]

primes = [n for n in range(2, 30) if all(n % d for d in range(2, int(n ** 0.5) + 1))]

pairs_sum_10 = [(a, b) for i, a in enumerate(nums) for b in nums[i + 1:] if a + b == 10]
```

> [!WARNING]
> - `[[0] * m] * n` creates aliased rows; use `[[0] * m for _ in range(n)]`.
> - A generator expression can be consumed only once — a second `list(gen)` is empty.
> - Order of `for` clauses matters: `[x for row in m for x in row]`, not the reverse.

> [!INTERVIEW]
> - Comprehensions are faster than equivalent `append` loops because the loop runs in optimised bytecode.
> - Use generator expressions inside `sum`, `any`, `all`, `max`, `min`, `"".join` to save memory.

> [!REMEMBER]
> `[expr for x in it if cond]` filters; `[a if cond else b for x in it]` maps; nested `for`s read like nested loops; parentheses make it lazy.
