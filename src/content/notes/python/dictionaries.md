A `dict` maps hashable keys to values using a hash table. It's the most important data structure for interview problems: counting, grouping, memoization, graph adjacency lists and lookups all use dicts.

## Creating dictionaries

```python
empty = {}
ages = {"Ada": 36, "Alan": 41}
from_pairs = dict([("a", 1), ("b", 2)])
from_kwargs = dict(x=1, y=2)
from_keys = dict.fromkeys(["a", "b"], 0)     # {'a': 0, 'b': 0}
squares = {n: n * n for n in range(5)}       # comprehension
zipped = dict(zip(["x", "y"], [10, 20]))
```

Since Python 3.7, dicts **preserve insertion order**.

## Access, insert, update, delete

```python
d = {"a": 1, "b": 2}

print(d["a"])              # 1 — KeyError if missing
print(d.get("z"))          # None — no error
print(d.get("z", 0))       # 0 — custom default

d["c"] = 3                 # insert / overwrite
d.update({"a": 10, "d": 4})
d |= {"e": 5}              # merge in place (3.9+)

del d["b"]                 # KeyError if missing
val = d.pop("c")           # remove & return
val = d.pop("zz", None)    # with default → no error
k, v = d.popitem()         # remove last inserted pair (LIFO)

print(d)                   # {'a': 10, 'd': 4}
```

### `setdefault` and `get` idioms

```python
counts = {}
for ch in "hello":
    counts[ch] = counts.get(ch, 0) + 1
print(counts)              # {'h': 1, 'e': 1, 'l': 2, 'o': 1}

groups = {}
for word in ["eat", "tea", "tan"]:
    groups.setdefault("".join(sorted(word)), []).append(word)
print(groups)              # {'aet': ['eat', 'tea'], 'ant': ['tan']}
```

## Iterating

```python
scores = {"Ada": 92, "Alan": 85, "Grace": 97}

for name in scores:                 # keys
    print(name)
for score in scores.values():       # values
    print(score)
for name, score in scores.items():  # key-value pairs
    print(f"{name}: {score}")

best = max(scores, key=scores.get)  # key with the largest value
print(best)                         # Grace

by_score = sorted(scores.items(), key=lambda kv: kv[1], reverse=True)
print(by_score)                     # [('Grace', 97), ('Ada', 92), ('Alan', 85)]
```

`keys()`, `values()` and `items()` return **views** — they reflect later changes to the dict and support set operations (`d1.keys() & d2.keys()`).

## defaultdict: no more missing-key checks

```python
from collections import defaultdict

graph = defaultdict(list)
for u, v in [(1, 2), (1, 3), (2, 3)]:
    graph[u].append(v)
    graph[v].append(u)
print(dict(graph))     # {1: [2, 3], 2: [1, 3], 3: [1, 2]}

freq = defaultdict(int)
for ch in "mississippi":
    freq[ch] += 1
print(freq["s"], freq["z"])   # 4 0  (accessing 'z' inserts it!)
```

> [!WARNING]
> Reading a missing key from a `defaultdict` **creates** it. Use `key in d` or `d.get(key)` if you only want to check.

## Counter: counting made trivial

```python
from collections import Counter

c = Counter("abracadabra")
print(c)                     # Counter({'a': 5, 'b': 2, 'r': 2, 'c': 1, 'd': 1})
print(c["a"], c["z"])        # 5 0  (missing → 0, NOT inserted)
print(c.most_common(2))      # [('a', 5), ('b', 2)]

print(Counter("listen") == Counter("silent"))   # anagram check → True
print(Counter("aab") - Counter("ab"))           # Counter({'a': 1})
print(sum(c.values()))                          # total count → 11
```

## Hashing rules

- Keys must be **hashable**: `int`, `str`, `tuple` (of hashables), `frozenset`, most custom objects.
- `list`, `dict`, `set` can't be keys.
- If `a == b`, then `hash(a) == hash(b)` must hold. Note `1 == 1.0 == True`, so they collide as the **same key**:

```python
d = {1: "int"}
d[1.0] = "float"
d[True] = "bool"
print(d)          # {1: 'bool'}
```

## Complexity

| Operation | Average | Worst |
|---|---|---|
| `d[k]`, `d[k] = v`, `del d[k]` | O(1) | O(n) |
| `k in d` | O(1) | O(n) |
| `len(d)` | O(1) | |
| iterate | O(n) | |
| `copy()` | O(n) | |

Worst cases happen with many hash collisions — rare in practice.

## Patterns you'll use constantly

```python
# 1. Two Sum in O(n): value → index
def two_sum(nums, target):
    index = {}
    for i, x in enumerate(nums):
        if target - x in index:
            return [index[target - x], i]
        index[x] = i

# 2. Invert a dict
inv = {v: k for k, v in {"a": 1, "b": 2}.items()}   # {1: 'a', 2: 'b'}

# 3. Group by a key
from collections import defaultdict
by_len = defaultdict(list)
for w in ["hi", "yo", "hey"]:
    by_len[len(w)].append(w)

# 4. Memoization table
memo = {}
def ways(n):
    if n <= 1:
        return 1
    if n not in memo:
        memo[n] = ways(n - 1) + ways(n - 2)
    return memo[n]
```

## OrderedDict: still useful for LRU tricks

```python
from collections import OrderedDict

lru = OrderedDict()
lru["a"] = 1; lru["b"] = 2; lru["c"] = 3
lru.move_to_end("a")           # mark as most recently used
lru.popitem(last=False)        # evict least recently used → ('b', 2)
print(list(lru))               # ['c', 'a']
```

> [!WARNING]
> - Don't add or delete keys while iterating over a dict — iterate over `list(d)` instead.
> - `d.keys()` is a live view; convert with `list(...)` if you need a snapshot.

> [!INTERVIEW]
> - Dicts are hash tables with O(1) average get/set; insertion-ordered since 3.7.
> - `get` vs `[]`: default value vs `KeyError`.
> - `defaultdict` creates missing keys on access; `Counter` returns 0 without inserting.

> [!REMEMBER]
> Count with `Counter`, group with `defaultdict(list)`, look up with `.get(k, default)`, and remember keys must be hashable.
