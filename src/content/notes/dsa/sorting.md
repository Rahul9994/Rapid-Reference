Sorting is a building block for countless algorithms: two pointers, binary search, greedy interval problems and deduplication all start with a sort. You'll use `sorted()` in practice — but interviews expect you to implement and analyse the classics.

## Concept

| Algorithm | Best | Average | Worst | Space | Stable | In-place |
|---|---|---|---|---|---|---|
| Selection sort | O(n²) | O(n²) | O(n²) | O(1) | No | Yes |
| Bubble sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| Insertion sort | O(n) | O(n²) | O(n²) | O(1) | Yes | Yes |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | Yes | No |
| Quick sort | O(n log n) | O(n log n) | O(n²) | O(log n) stack | No | Yes |
| Heap sort | O(n log n) | O(n log n) | O(n log n) | O(1) | No | Yes |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(k) | Yes | No |
| Timsort (Python) | O(n) | O(n log n) | O(n log n) | O(n) | Yes | No |

**Stable** = equal elements keep their relative order. Comparison sorts can't beat **Ω(n log n)** in the worst case.

## Core intuition

- **Selection**: repeatedly pick the minimum of the unsorted part.
- **Bubble**: swap adjacent out-of-order pairs; the largest "bubbles" to the end.
- **Insertion**: grow a sorted prefix by inserting the next element into place (great for nearly sorted data).
- **Merge**: split in halves, sort each, merge two sorted lists.
- **Quick**: partition around a pivot, then sort each side.

## Important patterns

### Selection sort

```python
def selection_sort(a):
    n = len(a)
    for i in range(n - 1):
        m = i
        for j in range(i + 1, n):
            if a[j] < a[m]:
                m = j
        a[i], a[m] = a[m], a[i]
    return a
```

### Bubble sort (with early exit)

```python
def bubble_sort(a):
    n = len(a)
    for end in range(n - 1, 0, -1):
        swapped = False
        for j in range(end):
            if a[j] > a[j + 1]:
                a[j], a[j + 1] = a[j + 1], a[j]
                swapped = True
        if not swapped:           # already sorted → O(n) best case
            break
    return a
```

### Insertion sort

```python
def insertion_sort(a):
    for i in range(1, len(a)):
        key = a[i]
        j = i - 1
        while j >= 0 and a[j] > key:
            a[j + 1] = a[j]       # shift right
            j -= 1
        a[j + 1] = key
    return a
```

### Merge sort

```python
def merge_sort(a):
    if len(a) <= 1:
        return a
    mid = len(a) // 2
    left, right = merge_sort(a[:mid]), merge_sort(a[mid:])
    out, i, j = [], 0, 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:          # <= keeps it stable
            out.append(left[i]); i += 1
        else:
            out.append(right[j]); j += 1
    out.extend(left[i:]); out.extend(right[j:])
    return out

print(merge_sort([38, 27, 43, 3, 9, 82, 10]))   # [3, 9, 10, 27, 38, 43, 82]
```

```diagram Merge sort: split down, merge up — log n levels × O(n) merge work
        [38 27 43 3 9 82 10]
        /                  \
   [38 27 43]          [3 9 82 10]
    /      \            /       \
  [38]  [27 43]      [3 9]    [82 10]
          ...   merge back up in sorted order ...
        [3 9 10 27 38 43 82]
```

**Counting inversions** is merge sort with one extra line: when `right[j]` is taken before `left[i]`, all remaining elements in `left` form inversions with it.

```python
def count_inversions(a):
    def sort(lo, hi):
        if hi - lo <= 1:
            return 0
        mid = (lo + hi) // 2
        inv = sort(lo, mid) + sort(mid, hi)
        merged, i, j = [], lo, mid
        while i < mid and j < hi:
            if a[i] <= a[j]:
                merged.append(a[i]); i += 1
            else:
                merged.append(a[j]); j += 1
                inv += mid - i                  # a[i..mid-1] are all > a[j]
        merged += a[i:mid] + a[j:hi]
        a[lo:hi] = merged
        return inv
    return sort(0, len(a))

print(count_inversions([2, 4, 1, 3, 5]))   # 3 → (2,1), (4,1), (4,3)
```

### Quick sort (Lomuto partition, random pivot)

```python
import random

def quick_sort(a, lo=0, hi=None):
    if hi is None:
        hi = len(a) - 1
    if lo >= hi:
        return a
    p = random.randint(lo, hi)            # random pivot avoids O(n²) on sorted input
    a[p], a[hi] = a[hi], a[p]
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] < pivot:
            a[i], a[j] = a[j], a[i]
            i += 1
    a[i], a[hi] = a[hi], a[i]             # pivot in its final position
    quick_sort(a, lo, i - 1)
    quick_sort(a, i + 1, hi)
    return a

print(quick_sort([5, 3, 8, 1, 9, 2]))     # [1, 2, 3, 5, 8, 9]
```

**Quickselect** finds the k-th smallest in O(n) average using the same partition but recursing into one side only.

### Counting sort (small integer range)

```python
def counting_sort(a, max_val):
    count = [0] * (max_val + 1)
    for x in a:
        count[x] += 1
    out = []
    for value, c in enumerate(count):
        out.extend([value] * c)
    return out

print(counting_sort([4, 2, 2, 8, 3, 3, 1], 8))   # [1, 2, 2, 3, 3, 4, 8]
```

### Sorting in Python for real

```python
nums = [5, 2, 9]
nums.sort()                                   # in place
names = sorted(["bo", "Al", "cy"], key=str.lower)
pairs = sorted([(2, "b"), (1, "z"), (2, "a")], key=lambda p: (p[0], p[1]))

from functools import cmp_to_key
def by_concat(x, y):                          # custom comparator: "largest number"
    return -1 if x + y > y + x else 1
print("".join(sorted(["3", "30", "34", "5", "9"], key=cmp_to_key(by_concat))))   # 9534330
```

## Complexity

See the table above. Remember why quicksort is fast in practice (cache-friendly, in place) and why merge sort is preferred when stability or guaranteed O(n log n) matters (and for linked lists).

## Common interview variations

- Sort an array of 0s, 1s, 2s (Dutch national flag) — O(n)
- Merge sorted arrays / k sorted lists (heap)
- Count inversions, reverse pairs (merge sort)
- Kth largest element (quickselect or heap)
- Sort a linked list (merge sort, O(1) extra space bottom-up)
- Recursive bubble / insertion sort (Striver A2Z basics)

> [!WARNING]
> Typical mistakes:
> - Using `<` instead of `<=` in merge → loses stability.
> - Quicksort with a fixed first/last pivot on sorted input → O(n²) and deep recursion.
> - Forgetting that `list.sort()` returns `None`.
> - Claiming counting sort is always better — it's O(n + k), terrible when k (value range) is huge.

> [!REMEMBER]
> Simple sorts are O(n²) (insertion is great for nearly-sorted data), merge sort is stable O(n log n) with O(n) space, quicksort is in-place O(n log n) average with a random pivot, and Python's Timsort is stable and adaptive.
