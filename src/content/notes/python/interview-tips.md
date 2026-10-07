Python lets you write interview solutions faster than almost any other language — if you know the idioms and avoid the traps. This page is a checklist to review the night before.

## The interview workflow

1. **Clarify** — input size, ranges, duplicates, negatives, empty input, sorted or not, return format.
2. **Examples** — walk through one normal case and one edge case by hand.
3. **Brute force first** — state its complexity, then optimise.
4. **Pick the pattern** — hashing, two pointers, sliding window, binary search, BFS/DFS, heap, DP…
5. **Code cleanly** — meaningful names, helper functions, no clever one-liners you can't explain.
6. **Test** — run the examples, then edge cases (empty, single element, all equal, max size).
7. **Analyse** — time and space complexity, and possible trade-offs.

## Idioms that save time

```python
# Swap
a, b = b, a

# Default dict-of-lists adjacency
from collections import defaultdict
graph = defaultdict(list)

# Counting
from collections import Counter
freq = Counter(nums)

# Index + value
for i, x in enumerate(nums): ...

# Pairs of adjacent elements
for a, b in zip(nums, nums[1:]): ...

# Infinity sentinels
best = float("inf")           # or math.inf

# Sort by multiple keys
items.sort(key=lambda t: (-t[1], t[0]))

# Reverse
rev = nums[::-1]

# 2D grid
dp = [[0] * cols for _ in range(rows)]

# 4-directional neighbours
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
for dr, dc in DIRS:
    nr, nc = r + dr, c + dc
    if 0 <= nr < rows and 0 <= nc < cols: ...

# Ceiling division
pages = -(-total // per_page)

# Memoization
from functools import cache
```

## Templates you should be able to write blind

### Binary search (first index where condition is true)

```python
def first_true(lo, hi, ok):
    """Smallest x in [lo, hi] with ok(x) True; hi + 1 if none. ok must be monotone."""
    while lo <= hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid - 1
        else:
            lo = mid + 1
    return lo
```

### BFS on a grid

```python
from collections import deque

def bfs(grid, start):
    rows, cols = len(grid), len(grid[0])
    dist = {start: 0}
    q = deque([start])
    while q:
        r, c = q.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != "#" and (nr, nc) not in dist:
                dist[(nr, nc)] = dist[(r, c)] + 1
                q.append((nr, nc))
    return dist
```

### Sliding window (longest valid window)

```python
def longest_window(s, k):
    """Longest substring with at most k distinct characters."""
    from collections import defaultdict
    count = defaultdict(int)
    left = best = 0
    for right, ch in enumerate(s):
        count[ch] += 1
        while len(count) > k:
            count[s[left]] -= 1
            if count[s[left]] == 0:
                del count[s[left]]
            left += 1
        best = max(best, right - left + 1)
    return best
```

### Backtracking

```python
def permutations(nums):
    res, path, used = [], [], [False] * len(nums)
    def go():
        if len(path) == len(nums):
            res.append(path[:])
            return
        for i, x in enumerate(nums):
            if not used[i]:
                used[i] = True; path.append(x)
                go()
                path.pop(); used[i] = False
    go()
    return res
```

## Traps that cost offers

> [!WARNING]
> - `[[0] * n] * m` → aliased rows. Use a comprehension.
> - Mutable default arguments (`def f(x, seen=[])`).
> - `list.pop(0)` / `insert(0, …)` in loops → O(n²). Use `deque`.
> - `x in list` inside a loop → O(n²). Convert to a `set`.
> - Recursion depth > 1000 → `RecursionError`. Increase the limit or go iterative.
> - Integer division: `/` returns float; use `//`. Negative floor division: `-7 // 2 == -4`.
> - Forgetting `res.append(path[:])` (copy) in backtracking.
> - Modifying a dict/list while iterating over it.
> - Comparing floats with `==`.
> - Shadowing built-ins: naming variables `list`, `dict`, `str`, `sum`, `max`, `id`, `input`.

## Writing readable code under pressure

```python
# ❌ cryptic
def f(a):
    return max([a[i+1]-a[i] for i in range(len(a)-1)] or [0])

# ✅ clear
def max_gap(nums):
    if len(nums) < 2:
        return 0
    return max(b - a for a, b in zip(nums, nums[1:]))
```

- Name helpers after what they do (`in_bounds`, `neighbors`).
- Handle edge cases at the top with guard clauses.
- Keep the main logic visible; extract fiddly parts.

## Testing quickly

```python
def solve(nums):
    ...

tests = [
    ([2, 7, 11, 15], 9),
    ([], None),
    ([1], None),
]
for args, expected in tests:
    got = solve(args)
    print("✓" if got == expected else "✗", args, got, expected)
```

## Performance tricks for online judges

```python
import sys
input = sys.stdin.readline               # fast input
sys.setrecursionlimit(10**6)             # deep recursion

def main():                              # locals are faster than globals
    n = int(input())
    data = list(map(int, input().split()))
    sys.stdout.write(str(sum(data)) + "\n")

main()
```

- Prefer built-ins (`sum`, `sorted`, `max`) and comprehensions over manual loops.
- Precompute and cache repeated work.
- Avoid deep copies and slicing in hot loops.

## Talking points

| Question | Strong answer includes |
|---|---|
| "Why Python?" | readability, rich standard library, big integers, quick prototyping |
| "Complexity?" | dominant operations, hidden costs of built-ins, space for recursion |
| "Can you optimise?" | identify repeated work → hashing / sorting / precomputation / DP |
| "Edge cases?" | empty, single, duplicates, negatives, overflow (not an issue in Python), huge inputs |

> [!INTERVIEW]
> Think out loud. A correct brute force with a clear path to optimisation is better than a silent, half-finished optimal solution.

> [!REMEMBER]
> Clarify → brute force → pattern → clean code → test → complexity. Know your templates (binary search, BFS, sliding window, backtracking) and the classic Python traps.
