Iterators power every `for` loop in Python. Generators are the easiest way to write your own iterators — and they enable lazy, memory-efficient pipelines.

## Iterable vs iterator

| | Iterable | Iterator |
|---|---|---|
| Definition | can produce an iterator | produces values one at a time |
| Protocol | `__iter__()` returns an iterator | `__iter__()` returns itself, `__next__()` returns next value |
| Examples | `list`, `str`, `dict`, `range`, files | `iter(list)`, generators, `map`, `zip`, files |
| Reusable? | Yes — call `iter()` again | No — exhausted after one pass |

```python
nums = [1, 2, 3]          # iterable
it = iter(nums)           # iterator
print(next(it), next(it), next(it))   # 1 2 3
# next(it)                → StopIteration
print(next(it, "done"))   # default instead of exception → done
```

## What a `for` loop really does

```python
for x in nums:
    print(x)

# is roughly:
_it = iter(nums)
while True:
    try:
        x = next(_it)
    except StopIteration:
        break
    print(x)
```

## Writing an iterator class

```python
class Countdown:
    def __init__(self, start):
        self.current = start

    def __iter__(self):
        return self

    def __next__(self):
        if self.current <= 0:
            raise StopIteration
        self.current -= 1
        return self.current + 1

print(list(Countdown(3)))   # [3, 2, 1]
```

## Generators: iterators made easy

A function containing `yield` returns a **generator**. Its state (local variables, position) is frozen between calls.

```python
def countdown(n):
    while n > 0:
        yield n          # pause here, hand n to the caller
        n -= 1

gen = countdown(3)
print(next(gen))         # 3
print(list(gen))         # [2, 1] — continues where it paused
```

```diagram Generator lifecycle
 created ──next()──► running ──yield──► suspended ──next()──► running ... ──return──► StopIteration
```

### Infinite and lazy sequences

```python
def fibonacci():
    a, b = 0, 1
    while True:              # infinite — fine, because it's lazy
        yield a
        a, b = b, a + b

from itertools import islice
print(list(islice(fibonacci(), 10)))   # [0, 1, 1, 2, 3, 5, 8, 13, 21, 34]
```

### Generator pipelines

Chain generators to process data in constant memory:

```python
def read_lines(path):
    with open(path, encoding="utf-8") as f:
        for line in f:
            yield line.rstrip("\n")

def non_empty(lines):
    return (ln for ln in lines if ln.strip())

def to_ints(lines):
    for ln in lines:
        try:
            yield int(ln)
        except ValueError:
            continue

# total = sum(to_ints(non_empty(read_lines("numbers.txt"))))
```

Each value flows through the whole pipeline before the next is read — no intermediate lists.

## `yield from`

Delegate to another iterable or generator:

```python
def flatten(nested):
    for item in nested:
        if isinstance(item, list):
            yield from flatten(item)     # recursive delegation
        else:
            yield item

print(list(flatten([1, [2, [3, 4]], 5])))   # [1, 2, 3, 4, 5]
```

Generators make tree traversals elegant:

```python
def inorder(node):
    if node:
        yield from inorder(node.left)
        yield node.val
        yield from inorder(node.right)
```

## Generator expressions

```python
squares = (x * x for x in range(10**8))   # instant: nothing computed yet
print(next(squares), next(squares))       # 0 1
print(sum(x for x in range(101)))         # 5050
```

## Sending values (advanced)

```python
def running_average():
    total = count = 0
    avg = None
    while True:
        value = yield avg        # receives the value passed to send()
        total += value
        count += 1
        avg = total / count

avg = running_average()
next(avg)                        # prime the generator
print(avg.send(10), avg.send(20), avg.send(30))   # 10.0 15.0 20.0
```

## itertools essentials

```python
from itertools import (count, cycle, repeat, chain, islice, accumulate,
                       permutations, combinations, product, groupby, pairwise)
import operator

print(list(islice(count(5, 2), 3)))             # [5, 7, 9]
print(list(chain([1, 2], (3,), "ab")))         # [1, 2, 3, 'a', 'b']
print(list(accumulate([1, 2, 3, 4])))          # prefix sums [1, 3, 6, 10]
print(list(accumulate([3, 1, 4], max)))        # running max [3, 3, 4]
print(list(permutations("abc", 2)))            # 6 ordered pairs
print(list(combinations([1, 2, 3], 2)))        # [(1, 2), (1, 3), (2, 3)]
print(list(product([0, 1], repeat=2)))         # [(0, 0), (0, 1), (1, 0), (1, 1)]
print([(k, len(list(g))) for k, g in groupby("aaabcc")])   # [('a', 3), ('b', 1), ('c', 2)]
print(list(pairwise([1, 4, 9])))               # [(1, 4), (4, 9)]  (3.10+)
```

> [!WARNING]
> - Iterators are single-use: after `list(gen)` the generator is empty.
> - `groupby` only groups **consecutive** equal keys — sort first if you need global groups.
> - Don't call `len()` on a generator; it has no length.

> [!INTERVIEW]
> - An iterable gives you an iterator via `iter()`; an iterator gives values via `next()`.
> - Generators save memory by producing values lazily and keep their state between `yield`s.
> - `return` inside a generator raises `StopIteration` (its value becomes `StopIteration.value`).
> - Use `yield from` to delegate to sub-generators (recursion, flattening).

> [!REMEMBER]
> `iter()` + `next()` + `StopIteration` is the whole protocol. Write generators with `yield` for lazy sequences, chain them into pipelines, and lean on `itertools` before writing loops by hand.
