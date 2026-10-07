Big-O analysis in Python is only correct if you know the cost of each built-in operation. A single innocent-looking `x in list` or `list.pop(0)` inside a loop can turn O(n) into O(n²).

## Big-O refresher

| Complexity | Name | n = 10⁶ → operations (approx.) |
|---|---|---|
| O(1) | constant | 1 |
| O(log n) | logarithmic | 20 |
| O(n) | linear | 10⁶ |
| O(n log n) | linearithmic | 2 × 10⁷ |
| O(n²) | quadratic | 10¹² ❌ |
| O(2ⁿ) | exponential | ❌ unless n ≤ ~25 |
| O(n!) | factorial | ❌ unless n ≤ ~10 |

> [!TIP]
> Pure Python handles roughly **10⁷ simple operations per second** (CPython). Use input limits to pick the target complexity:
> n ≤ 20 → O(2ⁿ) · n ≤ 500 → O(n³) · n ≤ 5000 → O(n²) · n ≤ 10⁶ → O(n log n) · larger → O(n) or O(log n).

## list

| Operation | Average | Notes |
|---|---|---|
| `a[i]`, `a[i] = x` | O(1) | |
| `len(a)` | O(1) | stored size |
| `a.append(x)` | O(1) amortized | occasional resize copies |
| `a.pop()` | O(1) | from the end |
| `a.pop(i)`, `a.insert(i, x)` | O(n − i) | shifts elements |
| `a.pop(0)`, `a.insert(0, x)` | **O(n)** | use `deque` |
| `x in a`, `a.index(x)`, `a.count(x)`, `a.remove(x)` | O(n) | linear scan |
| `a[i:j]` | O(j − i) | copies |
| `a + b` | O(len(a) + len(b)) | new list |
| `a.extend(b)` | O(len(b)) | |
| `a.sort()`, `sorted(a)` | O(n log n) | Timsort; O(n) if already sorted |
| `a.reverse()` | O(n) | |
| `min(a)`, `max(a)`, `sum(a)` | O(n) | |
| `a * k` | O(n·k) | |
| `del a[i]` | O(n − i) | |
| `a.copy()`, `list(a)` | O(n) | shallow |

## collections.deque

| Operation | Time |
|---|---|
| `append`, `appendleft`, `pop`, `popleft` | O(1) |
| `d[i]` (indexing) | O(n) in the worst case (O(1) at the ends) |
| `x in d` | O(n) |
| `rotate(k)` | O(k) |

## dict / set (hash tables)

| Operation | Average | Worst |
|---|---|---|
| `d[k]`, `d[k] = v`, `del d[k]`, `k in d` | O(1) | O(n) |
| `s.add`, `s.remove`, `x in s` | O(1) | O(n) |
| iteration | O(n) | |
| `s \| t` (union) | O(len(s) + len(t)) | |
| `s & t` (intersection) | O(min(len(s), len(t))) | |
| `s - t` | O(len(s)) | |
| `d.copy()` | O(n) | |

## str

| Operation | Time |
|---|---|
| `s[i]`, `len(s)` | O(1) |
| `s[i:j]` | O(j − i) |
| `s + t` | O(len(s) + len(t)) |
| `sub in s`, `s.find(sub)` | O(n·m) worst, typically ~O(n) |
| `"".join(parts)` | O(total length) |
| `s.split()`, `s.replace()`, `s.lower()`, `s.strip()` | O(n) |
| `s == t` | O(n) worst |
| `s[::-1]` | O(n) |

## heapq and bisect

| Operation | Time |
|---|---|
| `heapq.heappush`, `heapq.heappop` | O(log n) |
| `heapq.heapify` | O(n) |
| `h[0]` | O(1) |
| `heapq.nlargest(k, it)` | O(n log k) |
| `bisect.bisect_left/right` | O(log n) |
| `bisect.insort` | O(n) (O(log n) search + O(n) shift) |

## Hidden costs to watch

```python
# 1. Membership in a list inside a loop → O(n·m)
banned = ["a", "b", "c"]                # make it a set → O(n)
banned_set = set(banned)

# 2. Building strings with += in a loop → potentially O(n²)
parts = []
for x in range(1000):
    parts.append(str(x))
s = "".join(parts)                       # O(n)

# 3. Slicing inside recursion → extra O(n) per call
def sum_slice(a):                        # O(n²) time and memory
    return 0 if not a else a[0] + sum_slice(a[1:])

def sum_index(a, i=0):                   # O(n)
    return 0 if i == len(a) else a[i] + sum_index(a, i + 1)

# 4. Queue with list.pop(0) → O(n) per pop
from collections import deque
q = deque([1, 2, 3]); q.popleft()        # O(1)

# 5. Sorting inside a loop → O(n² log n); sort once, outside
```

## Space complexity reminders

- Recursion uses O(depth) stack space.
- Slices, `sorted()`, `list(…)`, comprehensions and `+` allocate new memory.
- Generators and `range` use O(1) extra space.
- Sets/dicts trade memory for speed: O(n) extra space for O(1) lookups.

## Amortized analysis in one picture

```diagram Dynamic array growth: occasional O(n) copies, O(1) on average
 capacity:  4        8                 16
 appends:  ████ → ████████ → ████████████████
 copies:      4        8                    → total copies < 2n for n appends
```

> [!INTERVIEW]
> - State both time and space complexity, and name the dominant operation.
> - Know which Python operations are not O(1): `x in list`, `list.pop(0)`, `list.insert(0, x)`, slicing, string concatenation in loops.
> - Average-case O(1) for dict/set relies on good hashing.

> [!REMEMBER]
> list end-ops O(1), front-ops O(n); dict/set ops O(1) average; heap push/pop O(log n), heapify O(n); sort O(n log n); slicing and concatenation copy.
