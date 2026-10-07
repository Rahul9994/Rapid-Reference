A `set` is an unordered collection of **unique, hashable** elements backed by a hash table. Its superpower is O(1) average membership testing.

## Creating sets

```python
s = {1, 2, 3}
empty = set()            # NOT {} — that's an empty dict
from_list = set([1, 2, 2, 3])
letters = set("banana")  # {'b', 'a', 'n'} (order not guaranteed)
evens = {x for x in range(10) if x % 2 == 0}   # set comprehension
print(from_list, len(letters))
```

## Adding and removing

```python
s = {1, 2}
s.add(3)            # {1, 2, 3}
s.update([4, 5])    # add many
s.remove(5)         # KeyError if missing
s.discard(42)       # no error if missing
x = s.pop()         # removes an arbitrary element
s.clear()
```

> [!WARNING]
> Sets only hold **hashable** items. `{[1, 2]}` raises `TypeError: unhashable type: 'list'` — use a tuple `{(1, 2)}` instead.

## Set algebra

```python
a = {1, 2, 3, 4}
b = {3, 4, 5}

print(a | b)    # union                {1, 2, 3, 4, 5}
print(a & b)    # intersection         {3, 4}
print(a - b)    # difference           {1, 2}
print(a ^ b)    # symmetric difference {1, 2, 5}

print({1, 2} <= a)       # subset → True
print(a >= {1, 2})       # superset → True
print(a.isdisjoint({9})) # no common elements → True
```

```diagram Venn view of a and b
   a = {1, 2, 3, 4}      b = {3, 4, 5}
   ┌─────────┬─────┬─────┐
   │  1  2   │ 3 4 │  5  │
   └─────────┴─────┴─────┘
     a - b     a & b  b - a
```

Method forms accept any iterable: `a.union([7, 8])`, `a.intersection(range(3))`. In-place versions: `|=`, `&=`, `-=`, `^=`.

## Complexity

| Operation | Average | Worst |
|---|---|---|
| `x in s` | O(1) | O(n) |
| `add`, `remove`, `discard` | O(1) | O(n) |
| `s \| t` | O(len(s) + len(t)) | |
| `s & t` | O(min(len(s), len(t))) | |
| `s - t` | O(len(s)) | |
| iterate | O(n) | |

## Common interview uses

### Fast membership / visited tracking

```python
def has_duplicate(nums):
    seen = set()
    for x in nums:
        if x in seen:
            return True
        seen.add(x)
    return False

print(has_duplicate([1, 2, 3, 1]))   # True
# One-liner: len(set(nums)) != len(nums)
```

### Two-sum existence check

```python
def has_pair(nums, target):
    seen = set()
    for x in nums:
        if target - x in seen:
            return True
        seen.add(x)
    return False
```

### Longest consecutive sequence (O(n))

```python
def longest_consecutive(nums):
    s = set(nums)
    best = 0
    for x in s:
        if x - 1 not in s:          # x starts a run
            y = x
            while y + 1 in s:
                y += 1
            best = max(best, y - x + 1)
    return best

print(longest_consecutive([100, 4, 200, 1, 3, 2]))   # 4
```

### Deduplicate while keeping order

```python
items = [3, 1, 3, 2, 1]
print(list(dict.fromkeys(items)))   # [3, 1, 2] — dicts keep insertion order
```

## frozenset: an immutable set

```python
fs = frozenset([1, 2, 3])
groups = {fs: "first"}         # hashable → usable as a dict key or set member
print(frozenset("ab") == frozenset("ba"))   # True
```

> [!WARNING]
> - `{}` creates a **dict**, not a set.
> - Don't rely on set iteration order — sort it if order matters: `sorted(s)`.
> - Sets of floats suffer from float precision (e.g. `0.1 + 0.2` vs `0.3`).

> [!INTERVIEW]
> - A set is a hash table of keys without values → O(1) average lookup.
> - Elements must be hashable (immutable built-ins, tuples of hashables, frozensets).
> - Converting a list to a set to test membership repeatedly turns O(n·m) into O(n + m).

> [!REMEMBER]
> Reach for a set whenever you ask "have I seen this?" Use tuples for composite keys, `discard` to remove safely, and `frozenset` when the set itself must be hashable.
