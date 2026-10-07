Most interview solutions in Python are a few lines long because the standard library does the heavy lifting. This page is a curated toolbox of what's worth knowing by heart.

## Built-in functions worth memorising

| Function | Example | Result |
|---|---|---|
| `len`, `sum`, `min`, `max` | `max([3, 9], default=0)` | `9` |
| `abs`, `round`, `pow`, `divmod` | `divmod(17, 5)` | `(3, 2)` |
| `sorted`, `reversed` | `sorted("cba")` | `['a', 'b', 'c']` |
| `enumerate`, `zip` | `list(zip("ab", [1, 2]))` | `[('a', 1), ('b', 2)]` |
| `map`, `filter` | `list(map(int, "12"))` | `[1, 2]` |
| `any`, `all` | `all([])` | `True` |
| `range` | `range(0, 10, 3)` | `0, 3, 6, 9` |
| `ord`, `chr` | `ord("A")` | `65` |
| `bin`, `hex`, `oct`, `int(s, base)` | `int("ff", 16)` | `255` |
| `isinstance`, `type`, `id`, `hash` | `isinstance(1, (int, float))` | `True` |
| `iter`, `next` | `next(iter([7]))` | `7` |
| `input`, `print`, `open` | | |

```python
nums = [5, 3, 8]
print(min(nums), max(nums), sum(nums) / len(nums))
print(sorted(nums, reverse=True), list(reversed(nums)))
print(max("apple", "fig", key=len), min([], default=None))
```

## collections

```python
from collections import deque, Counter, defaultdict, OrderedDict, namedtuple

dq = deque([1, 2, 3], maxlen=5)
dq.appendleft(0); dq.append(4)
dq.rotate(1)                 # deque([4, 0, 1, 2, 3])
print(dq.popleft(), dq.pop(), list(dq))   # 4 3 [0, 1, 2]

print(Counter("aabbbc").most_common(1))         # [('b', 3)]
graph = defaultdict(set); graph[1].add(2)
Pair = namedtuple("Pair", "a b")
```

| Structure | Best for | Key operations |
|---|---|---|
| `deque` | queues, sliding windows, BFS | O(1) `append/appendleft/pop/popleft` |
| `Counter` | frequency counts, anagrams | `most_common`, `+ - & \|` |
| `defaultdict` | grouping, adjacency lists | auto-creates missing keys |
| `OrderedDict` | LRU caches | `move_to_end`, `popitem(last=False)` |
| `namedtuple` | lightweight records | attribute access, immutable |

## heapq: priority queues

Python's `heapq` is a **min-heap** stored in a plain list.

```python
import heapq

h = []
for x in [5, 1, 8, 3]:
    heapq.heappush(h, x)
print(heapq.heappop(h), h[0])              # 1 3 — smallest first, peek with h[0]

nums = [9, 4, 7, 1]
heapq.heapify(nums)                         # O(n) in place
print(heapq.nsmallest(2, [9, 4, 7, 1]), heapq.nlargest(2, [9, 4, 7, 1]))   # [1, 4] [9, 7]

# Max-heap: negate values
mx = [-x for x in [3, 10, 6]]
heapq.heapify(mx)
print(-heapq.heappop(mx))                   # 10

# Push-then-pop / pop-then-push in one step
print(heapq.heappushpop([2, 5], 1), heapq.heapreplace([2, 5], 9))   # 1 2
```

| Operation | Time |
|---|---|
| `heappush`, `heappop` | O(log n) |
| `heapify` | O(n) |
| `h[0]` (peek) | O(1) |
| `nlargest(k, it)` / `nsmallest` | O(n log k) |

## bisect: binary search on sorted lists

```python
import bisect

a = [1, 3, 3, 3, 7]
print(bisect.bisect_left(a, 3))    # 1 — first index where 3 could go (lower bound)
print(bisect.bisect_right(a, 3))   # 4 — after the last 3 (upper bound)
print(bisect.bisect_right(a, 3) - bisect.bisect_left(a, 3))   # count of 3s → 3

bisect.insort(a, 5)                # insert keeping order (O(n) due to shifting)
print(a)                           # [1, 3, 3, 3, 5, 7]

def contains(sorted_list, x):
    i = bisect.bisect_left(sorted_list, x)
    return i < len(sorted_list) and sorted_list[i] == x
```

Since Python 3.10, `bisect` accepts `key=`.

## itertools

```python
from itertools import accumulate, combinations, permutations, product, chain, groupby

print(list(accumulate([2, 3, 4])))                  # prefix sums [2, 5, 9]
print(list(accumulate([2, 3, 4], initial=0)))       # [0, 2, 5, 9]  (3.8+)
print(len(list(combinations(range(5), 3))))         # C(5,3) = 10
print(len(list(permutations(range(4)))))            # 4! = 24
print(list(product("ab", repeat=2)))                # [('a','a'), ('a','b'), ('b','a'), ('b','b')]
print(list(chain.from_iterable([[1], [2, 3]])))     # flatten one level → [1, 2, 3]
```

## functools

```python
from functools import lru_cache, cache, reduce, partial, cmp_to_key

@cache
def C(n, k):
    return 1 if k in (0, n) else C(n - 1, k - 1) + C(n - 1, k)

def compare(a, b):                    # largest-number problem
    return -1 if a + b > b + a else (1 if a + b < b + a else 0)

nums = ["3", "30", "34", "5", "9"]
print("".join(sorted(nums, key=cmp_to_key(compare))))   # 9534330
```

## math

```python
import math

print(math.gcd(24, 36), math.lcm(4, 6))      # 12 12  (lcm: 3.9+)
print(math.isqrt(99), math.sqrt(2))          # 9 1.4142135623730951
print(math.comb(10, 3), math.perm(5, 2))     # 120 20
print(math.factorial(10), math.prod([2, 3, 4]))   # 3628800 24
print(math.ceil(7 / 2), math.floor(-3.5))    # 4 -4
print(math.log2(1024), math.log(100, 10))    # 10.0 2.0
print(math.inf > 10**100, -math.inf)         # True -inf
```

> [!TIP]
> Ceiling division without floats (no precision issues for huge numbers): `-(-a // b)` or `(a + b - 1) // b` for positive `b`.

## Other handy modules

```python
import random, string, sys, time, operator

random.seed(42)
print(random.randint(1, 6), random.choice("abc"), random.sample(range(10), 3))
lst = [1, 2, 3]; random.shuffle(lst)

print(string.ascii_lowercase[:5], string.digits)
print(sys.maxsize)                    # largest Py_ssize_t (ints themselves are unbounded)

t0 = time.perf_counter()
_ = sum(range(10**5))
print(f"{time.perf_counter() - t0:.4f}s")

print(sorted([(1, "b"), (1, "a")], key=operator.itemgetter(1)))
```

| Need | Use |
|---|---|
| Fixed-size sliding window max | `collections.deque` (monotonic) |
| Top-K | `heapq.nlargest` or a size-K heap |
| Sorted container with fast insert | `bisect` (small), or third-party `sortedcontainers` |
| Count things | `Counter` |
| Memoize recursion | `@cache` / `@lru_cache(None)` |
| Prefix sums | `itertools.accumulate` |
| All subsets / pairs | `itertools.combinations` |

> [!INTERVIEW]
> - `heapq` is a min-heap; use negatives (or tuples) for max-heap behaviour.
> - `bisect_left` = lower bound, `bisect_right` = upper bound.
> - `deque` gives O(1) pops from both ends; `list.pop(0)` is O(n).
> - Interviewers usually allow standard library modules — but be ready to implement a heap or binary search from scratch.

> [!REMEMBER]
> `collections` for structures, `heapq` for priorities, `bisect` for sorted searches, `itertools` for combinatorics and prefix sums, `functools` for caching, `math` for number theory.
