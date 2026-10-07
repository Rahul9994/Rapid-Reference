A `list` is an ordered, mutable, dynamic array of object references. It's the workhorse of Python DSA: arrays, stacks, matrices and DP tables are all lists.

## Creating lists

```python
empty = []
nums = [3, 1, 4, 1, 5]
mixed = [1, "two", 3.0, [4]]        # any types
from_iter = list(range(5))          # [0, 1, 2, 3, 4]
chars = list("abc")                 # ['a', 'b', 'c']
zeros = [0] * 5                     # [0, 0, 0, 0, 0]
squares = [x * x for x in range(5)] # comprehension
```

## Indexing and slicing

```python
a = [10, 20, 30, 40, 50]
print(a[0], a[-1], a[-2])    # 10 50 40
print(a[1:4])                # [20, 30, 40]  (end exclusive)
print(a[:2], a[3:])          # [10, 20] [40, 50]
print(a[::2])                # [10, 30, 50]  step 2
print(a[::-1])               # [50, 40, 30, 20, 10]  reversed copy
print(a[10:])                # []  slicing never raises IndexError
```

```diagram Positive and negative indices
 index:    0    1    2    3    4
         [ 10 | 20 | 30 | 40 | 50 ]
 neg:     -5   -4   -3   -2   -1
```

Slice assignment can replace, insert or delete ranges:

```python
a = [1, 2, 3, 4, 5]
a[1:3] = [20, 30, 35]   # replace 2 items with 3 → [1, 20, 30, 35, 4, 5]
a[:0] = [0]             # insert at front
del a[::2]              # delete every other element
print(a)                # [1, 30, 4]
```

## Essential methods

| Method | Does | Time |
|---|---|---|
| `append(x)` | add to end | O(1) amortized |
| `extend(it)` | add all items | O(k) |
| `insert(i, x)` | insert at index | O(n) |
| `pop()` | remove & return last | O(1) |
| `pop(i)` | remove & return at i | O(n) |
| `remove(x)` | remove first occurrence | O(n) |
| `index(x)` | first index of x (ValueError if absent) | O(n) |
| `count(x)` | occurrences | O(n) |
| `sort()` | sort in place (stable) | O(n log n) |
| `reverse()` | reverse in place | O(n) |
| `copy()` | shallow copy | O(n) |
| `clear()` | remove all | O(n) |

```python
stack = []
stack.append(1); stack.append(2)
print(stack.pop(), stack)       # 2 [1]

nums = [5, 2, 9, 1]
nums.sort()                      # in place, returns None
print(nums)                      # [1, 2, 5, 9]
print(sorted(nums, reverse=True))  # new list [9, 5, 2, 1]
```

> [!WARNING]
> `nums = nums.sort()` sets `nums` to `None`. In-place methods (`sort`, `reverse`, `append`, `extend`) return `None`.

## Sorting with keys

```python
words = ["banana", "Apple", "cherry", "fig"]
print(sorted(words))                     # case-sensitive: uppercase first
print(sorted(words, key=str.lower))      # case-insensitive
print(sorted(words, key=len))            # by length (stable)

people = [("Ada", 36), ("Alan", 41), ("Grace", 36)]
print(sorted(people, key=lambda p: (-p[1], p[0])))   # age desc, then name asc
```

```output
['Apple', 'banana', 'cherry', 'fig']
['Apple', 'banana', 'cherry', 'fig']
['fig', 'Apple', 'banana', 'cherry']
[('Alan', 41), ('Ada', 36), ('Grace', 36)]
```

Python's sort (Timsort) is **stable**: equal keys keep their original order — so you can sort by multiple keys in successive passes (least significant first).

## Copying: shallow vs deep

```python
import copy

a = [[1, 2], [3, 4]]
shallow = a.copy()          # same as a[:] or list(a)
deep = copy.deepcopy(a)

a[0].append(99)
print(shallow[0])   # [1, 2, 99]  — inner lists are shared
print(deep[0])      # [1, 2]      — fully independent
```

## The 2D list trap

```python
bad = [[0] * 3] * 3        # 3 references to ONE inner list
bad[0][0] = 1
print(bad)                 # [[1, 0, 0], [1, 0, 0], [1, 0, 0]]

good = [[0] * 3 for _ in range(3)]   # 3 independent rows
good[0][0] = 1
print(good)                # [[1, 0, 0], [0, 0, 0], [0, 0, 0]]
```

> [!IMPORTANT]
> Always build grids and DP tables with a comprehension: `dp = [[0] * (m + 1) for _ in range(n + 1)]`.

## Useful built-ins with lists

```python
nums = [4, 8, 15, 16, 23, 42]
print(len(nums), sum(nums), min(nums), max(nums))   # 6 108 4 42
print(max(nums, key=lambda x: x % 10))              # 8  (largest last digit)
print(any(x > 40 for x in nums), all(x > 0 for x in nums))  # True True
print(list(reversed(nums))[:2])                     # [42, 23]
print(nums.index(15), 15 in nums)                   # 2 True
```

### Unpacking and concatenation

```python
first, *middle, last = [1, 2, 3, 4, 5]
print(first, middle, last)      # 1 [2, 3, 4] 5
print([1, 2] + [3], [0] * 3)    # [1, 2, 3] [0, 0, 0]
```

## Lists as stacks and queues

```python
stack = [1, 2, 3]
stack.append(4)      # push
stack.pop()          # pop → 4, O(1)

from collections import deque
queue = deque([1, 2, 3])
queue.append(4)      # enqueue
queue.popleft()      # dequeue → 1, O(1)
```

> [!WARNING]
> `list.pop(0)` and `list.insert(0, x)` are **O(n)** — every element shifts. Use `collections.deque` for queues.

## How lists work internally

A list stores a contiguous array of **pointers** with extra capacity. When full, CPython over-allocates (grows by roughly 1/8 plus a constant), so `append` is O(1) **amortized**.

| Operation | Complexity |
|---|---|
| index / assign `a[i]` | O(1) |
| `append`, `pop()` | O(1) amortized |
| `insert(0, x)`, `pop(0)` | O(n) |
| `x in a` | O(n) |
| slice `a[i:j]` | O(j − i) |
| `sort` | O(n log n) |

> [!INTERVIEW]
> - Lists are dynamic arrays (not linked lists) — random access is O(1).
> - `sort()` vs `sorted()`: in place returning `None` vs new list from any iterable.
> - Shallow copy duplicates the outer list only; nested objects are shared.

> [!REMEMBER]
> Slices never raise and create copies; build 2D lists with comprehensions; use `deque` for queues; `sort` is stable and accepts a `key`.
