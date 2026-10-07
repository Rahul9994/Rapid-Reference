Python supports a functional style: small anonymous functions (`lambda`), higher-order built-ins (`map`, `filter`, `sorted`, `min`, `max`) and the `functools` / `operator` modules.

## Lambda functions

`lambda params: expression` creates a small anonymous function. The body must be a **single expression** (no statements, no annotations).

```python
square = lambda x: x * x
add = lambda a, b=1: a + b
print(square(5), add(2), add(2, 3))   # 25 3 5
```

Lambdas shine as **key functions**:

```python
points = [(1, 5), (3, 1), (2, 2)]
print(sorted(points, key=lambda p: p[1]))            # sort by y
print(max(points, key=lambda p: p[0] + p[1]))        # largest x + y
intervals = [[5, 7], [1, 3], [2, 4]]
intervals.sort(key=lambda iv: iv[0])                 # sort by start
```

> [!TIP]
> If you assign a lambda to a name (`f = lambda x: ...`), PEP 8 says use `def` instead — you get a real name in tracebacks and room for a docstring.

## map

`map(func, *iterables)` applies `func` lazily and returns an iterator.

```python
nums = ["1", "2", "3"]
print(list(map(int, nums)))                  # [1, 2, 3]
print(list(map(lambda x: x * 2, [1, 2])))    # [2, 4]
print(list(map(pow, [2, 3], [3, 2])))        # [8, 9] — multiple iterables
a, b = map(int, "4 7".split())               # classic input parsing
```

## filter

`filter(func, iterable)` keeps items where `func(item)` is truthy.

```python
nums = range(10)
print(list(filter(lambda x: x % 3 == 0, nums)))   # [0, 3, 6, 9]
print(list(filter(None, [0, 1, "", "a", None])))  # [1, 'a'] — removes falsy
```

## reduce

`functools.reduce(func, iterable[, initial])` folds a sequence into one value.

```python
from functools import reduce
import operator

print(reduce(lambda acc, x: acc + x, [1, 2, 3, 4]))       # 10
print(reduce(operator.mul, range(1, 6), 1))              # 120 (5!)
print(reduce(lambda a, b: a if a > b else b, [3, 9, 2])) # 9

from math import gcd
print(reduce(gcd, [12, 18, 24]))                         # 6 — gcd of a list
```

```diagram How reduce folds [1, 2, 3, 4] with +
 ((1 + 2) + 3) + 4
    3   → 6   → 10
```

> [!WARNING]
> `reduce` on an empty iterable without an `initial` value raises `TypeError`. Always pass an initial value when the input may be empty.

## Comprehension or map/filter?

| Task | Functional | Comprehension (usually preferred) |
|---|---|---|
| transform | `map(str, nums)` | `[str(x) for x in nums]` |
| filter | `filter(pred, nums)` | `[x for x in nums if pred(x)]` |
| both | `map(f, filter(p, nums))` | `[f(x) for x in nums if p(x)]` |

`map` with a built-in (`map(int, ...)`) is concise and fast; with a lambda, a comprehension is usually clearer.

## any and all

```python
nums = [2, 4, 7]
print(any(x % 2 for x in nums))     # True — at least one odd
print(all(x > 0 for x in nums))     # True — every element positive
print(all([]), any([]))             # True False — vacuous truth
```

Both short-circuit: they stop as soon as the answer is known.

## sorted, min, max with key

```python
words = ["kiwi", "fig", "banana", "apple"]
print(sorted(words, key=len))                   # ['fig', 'kiwi', 'apple', 'banana']
print(sorted(words, key=lambda w: (-len(w), w)))  # longest first, then alphabetical
print(min(words, key=len), max(words, key=len)) # fig banana
print(max([], default=0))                       # 0 instead of ValueError
```

## operator module: faster than lambdas

```python
from operator import itemgetter, attrgetter

rows = [("ada", 36), ("alan", 41)]
print(sorted(rows, key=itemgetter(1)))         # by index 1
get_xy = itemgetter(0, 1)
print(get_xy([9, 8, 7]))                       # (9, 8)
# sorted(users, key=attrgetter("age"))         # by attribute
```

## functools.partial

Fix some arguments of a function to create a new one:

```python
from functools import partial

def power(base, exp):
    return base ** exp

square = partial(power, exp=2)
cube = partial(power, exp=3)
print(square(5), cube(2))         # 25 8

to_int_base2 = partial(int, base=2)
print(to_int_base2("1011"))       # 11
```

> [!INTERVIEW]
> - `lambda` = anonymous single-expression function; great for `key=` arguments.
> - `map`/`filter` return lazy iterators in Python 3 — wrap in `list()` to materialise.
> - `reduce` lives in `functools`; it was removed from built-ins in Python 3.

> [!REMEMBER]
> Use lambdas for keys, comprehensions for most map/filter work, `any`/`all` for checks, `reduce` with an initial value, and `itemgetter`/`partial` for clean, fast helpers.
