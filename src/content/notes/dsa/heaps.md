A heap is a complete binary tree stored in an array where every parent is ≤ its children (min-heap). It gives O(1) access to the minimum and O(log n) insert/remove — the engine behind priority queues, top-K problems, Dijkstra and scheduling.

## Concept

```diagram Min-heap as a tree and as an array
            1                 index:  0  1  2  3  4  5
          /   \               array: [1, 3, 2, 7, 4, 5]
         3     2
        / \   /               parent(i) = (i - 1) // 2
       7   4 5                left(i)   = 2i + 1
                              right(i)  = 2i + 2
```

- **Heap property**: parent ≤ children (min-heap) or parent ≥ children (max-heap). Siblings are unordered.
- **Complete tree** → no gaps → an array works with simple index arithmetic.
- A **priority queue** is the abstract data type; a heap is the usual implementation.

## Core intuition

You only need cheap access to the *best* element, not a fully sorted order. Keeping just the heap property is much cheaper than sorting: insert bubbles a value up one path, removal sifts the last value down one path — both O(log n).

## Important patterns

### 1. Python's heapq (min-heap)

```python
import heapq

nums = [5, 3, 8, 1, 9, 2]
heapq.heapify(nums)              # O(n)
heapq.heappush(nums, 0)          # O(log n)
print(nums[0])                   # 0 — peek min, O(1)
print([heapq.heappop(nums) for _ in range(3)])   # [0, 1, 2]

# Max-heap: push negatives
maxh = []
for x in [5, 3, 8]:
    heapq.heappush(maxh, -x)
print(-maxh[0])                  # 8

# Tuples compare lexicographically → (priority, item)
tasks = [(2, "write"), (1, "plan"), (3, "ship")]
heapq.heapify(tasks)
print(heapq.heappop(tasks))      # (1, 'plan')
```

### 2. Implementing a min-heap

```python
class MinHeap:
    def __init__(self):
        self.a = []

    def push(self, x):
        a = self.a
        a.append(x)
        i = len(a) - 1
        while i > 0 and a[(i - 1) // 2] > a[i]:          # sift up
            p = (i - 1) // 2
            a[i], a[p] = a[p], a[i]
            i = p

    def pop(self):
        a = self.a
        top = a[0]
        last = a.pop()
        if a:
            a[0] = last
            i, n = 0, len(a)
            while True:                                   # sift down
                l, r, smallest = 2 * i + 1, 2 * i + 2, i
                if l < n and a[l] < a[smallest]:
                    smallest = l
                if r < n and a[r] < a[smallest]:
                    smallest = r
                if smallest == i:
                    break
                a[i], a[smallest] = a[smallest], a[i]
                i = smallest
        return top

h = MinHeap()
for x in [5, 1, 4, 2]:
    h.push(x)
print([h.pop() for _ in range(4)])   # [1, 2, 4, 5]
```

> [!NOTE]
> `heapify` is O(n), not O(n log n): most nodes are near the bottom and sift down only a few levels (∑ height ≈ n).

### 3. Top-K with a size-K heap

```python
import heapq

def kth_largest(nums, k):
    heap = []
    for x in nums:
        heapq.heappush(heap, x)
        if len(heap) > k:
            heapq.heappop(heap)          # drop the smallest → heap keeps the k largest
    return heap[0]

def top_k_frequent(nums, k):
    from collections import Counter
    return [x for x, _ in heapq.nlargest(k, Counter(nums).items(), key=lambda p: p[1])]

print(kth_largest([3, 2, 1, 5, 6, 4], 2), top_k_frequent([1, 1, 1, 2, 2, 3], 2))   # 5 [1, 2]
```

O(n log k) — better than sorting when k ≪ n.

### 4. Merge K sorted lists

```python
import heapq

def merge_k_sorted(lists):
    heap = [(lst[0], i, 0) for i, lst in enumerate(lists) if lst]
    heapq.heapify(heap)
    out = []
    while heap:
        val, i, j = heapq.heappop(heap)
        out.append(val)
        if j + 1 < len(lists[i]):
            heapq.heappush(heap, (lists[i][j + 1], i, j + 1))
    return out

print(merge_k_sorted([[1, 4, 5], [1, 3, 4], [2, 6]]))   # [1, 1, 2, 3, 4, 4, 5, 6]
```

The list index `i` breaks ties so Python never compares incomparable objects (important for linked-list nodes).

### 5. Running median (two heaps)

```python
import heapq

class MedianFinder:
    def __init__(self):
        self.low = []    # max-heap (negated): smaller half
        self.high = []   # min-heap: larger half

    def add(self, x):
        heapq.heappush(self.low, -x)
        heapq.heappush(self.high, -heapq.heappop(self.low))   # move the largest of low to high
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self):
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2

mf = MedianFinder()
for x in [5, 15, 1, 3]:
    mf.add(x)
print(mf.median())   # 4.0 → sorted [1, 3, 5, 15]
```

### 6. K closest points

```python
import heapq

def k_closest(points, k):
    return heapq.nsmallest(k, points, key=lambda p: p[0] ** 2 + p[1] ** 2)

print(k_closest([[1, 3], [-2, 2], [5, 8]], 2))   # [[-2, 2], [1, 3]]
```

### 7. Task scheduler / greedy with a heap

```python
import heapq
from collections import Counter

def least_interval(tasks, n):
    heap = [-c for c in Counter(tasks).values()]
    heapq.heapify(heap)
    time = 0
    while heap:
        cycle, temp = n + 1, []
        while cycle and heap:
            c = heapq.heappop(heap) + 1      # run the most frequent remaining task
            if c:
                temp.append(c)
            cycle -= 1
            time += 1
        for c in temp:
            heapq.heappush(heap, c)
        if heap:
            time += cycle                    # idle slots
    return time

print(least_interval(["A", "A", "A", "B", "B", "B"], 2))   # 8
```

### 8. Lazy deletion (heap with removals)

`heapq` can't delete arbitrary items efficiently. Keep a counter of "deleted" values and discard them when they reach the top:

```python
import heapq
from collections import Counter

class LazyHeap:
    def __init__(self):
        self.h, self.dead = [], Counter()

    def push(self, x):
        heapq.heappush(self.h, x)

    def remove(self, x):
        self.dead[x] += 1

    def top(self):
        while self.h and self.dead[self.h[0]]:
            self.dead[heapq.heappop(self.h)] -= 1
        return self.h[0] if self.h else None
```

## Complexity

| Operation | Time |
|---|---|
| peek min | O(1) |
| push / pop | O(log n) |
| heapify | O(n) |
| heap sort | O(n log n) |
| top-K with size-K heap | O(n log k) |
| merge K sorted lists (N total items) | O(N log K) |

## Common interview variations

- Kth largest element, kth largest in a stream, top K frequent elements/words
- Merge K sorted lists/arrays, smallest range covering K lists
- Find median from a data stream, sliding window median
- Task scheduler, reorganize string, hands of straights
- K closest points, connect ropes with minimum cost, IPO / maximum capital
- Dijkstra's shortest path, Prim's MST

> [!WARNING]
> Typical mistakes:
> - Forgetting `heapq` is a **min**-heap (negate for max).
> - Pushing objects that can't be compared when priorities tie — add a counter/index tiebreaker.
> - Assuming the heap list is sorted — only `h[0]` is guaranteed to be the minimum.
> - Using `heapq.heappop` on an empty heap (IndexError).

> [!REMEMBER]
> Heap = complete tree in an array, parent at `(i−1)//2`. `heapify` O(n), push/pop O(log n). Top-K → size-K heap. Median → two heaps. Ties → `(priority, counter, item)`.
