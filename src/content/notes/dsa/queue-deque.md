A queue is FIFO — first in, first out. In Python, use `collections.deque`, which supports O(1) appends and pops at **both** ends. Queues drive BFS, scheduling and sliding-window maximum problems.

## Concept

```diagram Queue: enqueue at the rear, dequeue from the front
 dequeue ◄── [ 1 | 2 | 3 | 4 ] ◄── enqueue
            front         rear
```

```python
from collections import deque

q = deque()
q.append(1); q.append(2)       # enqueue
front = q[0]                   # peek → 1
q.popleft()                    # dequeue → 1, O(1)

dq = deque([2, 3])
dq.appendleft(1)               # deque: both ends
dq.append(4)
print(dq.pop(), dq.popleft(), dq)   # 4 1 deque([2, 3])
```

> [!WARNING]
> `list.pop(0)` is O(n) because every element shifts left. Never use a list as a queue in BFS.

| Structure | Python | Front ops | Back ops |
|---|---|---|---|
| Queue | `deque` | `popleft` O(1) | `append` O(1) |
| Deque | `deque` | `appendleft` / `popleft` O(1) | `append` / `pop` O(1) |
| Priority queue | `heapq` | `heappop` O(log n) | `heappush` O(log n) |
| Thread-safe queue | `queue.Queue` | blocking `get` | blocking `put` |

## Core intuition

Queues process items **in arrival order** — which is exactly "level by level" in BFS (nearest first). A deque additionally lets you discard stale items from either end, enabling monotonic-deque tricks.

## Important patterns

### 1. Circular queue with a fixed array

```python
class CircularQueue:
    def __init__(self, k):
        self.buf = [None] * k
        self.head = 0          # index of the front
        self.size = 0

    def enqueue(self, x):
        if self.size == len(self.buf):
            return False
        self.buf[(self.head + self.size) % len(self.buf)] = x
        self.size += 1
        return True

    def dequeue(self):
        if self.size == 0:
            return None
        x = self.buf[self.head]
        self.head = (self.head + 1) % len(self.buf)
        self.size -= 1
        return x

cq = CircularQueue(2)
print(cq.enqueue(1), cq.enqueue(2), cq.enqueue(3), cq.dequeue(), cq.enqueue(3))   # True True False 1 True
```

### 2. Queue using two stacks (amortized O(1))

```python
class MyQueue:
    def __init__(self):
        self.inbox, self.outbox = [], []

    def push(self, x):
        self.inbox.append(x)

    def pop(self):
        self.peek()
        return self.outbox.pop()

    def peek(self):
        if not self.outbox:                 # transfer only when needed
            while self.inbox:
                self.outbox.append(self.inbox.pop())
        return self.outbox[-1]

q = MyQueue()
q.push(1); q.push(2)
print(q.pop(), q.peek())   # 1 2
```

Each element moves from `inbox` to `outbox` at most once → amortized O(1).

### 3. Stack using one queue

```python
from collections import deque

class MyStack:
    def __init__(self):
        self.q = deque()

    def push(self, x):
        self.q.append(x)
        for _ in range(len(self.q) - 1):    # rotate so x is at the front
            self.q.append(self.q.popleft())

    def pop(self):
        return self.q.popleft()

s = MyStack()
s.push(1); s.push(2)
print(s.pop())   # 2
```

### 4. BFS level-order processing

```python
from collections import deque

def bfs_levels(graph, start):
    levels, seen, q = [], {start}, deque([start])
    while q:
        level = []
        for _ in range(len(q)):              # exactly the nodes of this level
            node = q.popleft()
            level.append(node)
            for nxt in graph[node]:
                if nxt not in seen:
                    seen.add(nxt)
                    q.append(nxt)
        levels.append(level)
    return levels

g = {1: [2, 3], 2: [4], 3: [4], 4: []}
print(bfs_levels(g, 1))   # [[1], [2, 3], [4]]
```

### 5. Monotonic deque — sliding window maximum

```python
from collections import deque

def max_sliding_window(nums, k):
    dq, res = deque(), []                    # indices; values decreasing front → back
    for i, x in enumerate(nums):
        if dq and dq[0] == i - k:
            dq.popleft()                     # left the window
        while dq and nums[dq[-1]] <= x:
            dq.pop()                         # can never be the max again
        dq.append(i)
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]
```

### 6. Shortest subarray with sum ≥ K (works with negatives)

```python
from collections import deque

def shortest_subarray(nums, k):
    prefix = [0]
    for x in nums:
        prefix.append(prefix[-1] + x)
    best, dq = float("inf"), deque()         # increasing prefix sums
    for i, p in enumerate(prefix):
        while dq and p - prefix[dq[0]] >= k:
            best = min(best, i - dq.popleft())
        while dq and prefix[dq[-1]] >= p:
            dq.pop()
        dq.append(i)
    return best if best != float("inf") else -1

print(shortest_subarray([2, -1, 2], 3))   # 3
```

### 7. Rotting oranges (multi-source BFS)

```python
from collections import deque

def oranges_rotting(grid):
    R, C = len(grid), len(grid[0])
    q, fresh = deque(), 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 2:
                q.append((r, c))
            elif grid[r][c] == 1:
                fresh += 1
    minutes = 0
    while q and fresh:
        for _ in range(len(q)):
            r, c = q.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == 1:
                    grid[nr][nc] = 2
                    fresh -= 1
                    q.append((nr, nc))
        minutes += 1
    return minutes if fresh == 0 else -1

print(oranges_rotting([[2, 1, 1], [1, 1, 0], [0, 1, 1]]))   # 4
```

## Complexity

| Operation / problem | Time | Space |
|---|---|---|
| `deque` append/pop at either end | O(1) | — |
| Circular queue ops | O(1) | O(k) |
| Queue via two stacks | O(1) amortized | O(n) |
| Sliding window maximum | O(n) | O(k) |
| BFS | O(V + E) | O(V) |

## Common interview variations

- Implement queue using stacks / stack using queues, circular queue/deque
- Sliding window maximum, first negative in every window of size k
- Rotting oranges, walls and gates, shortest path in a binary matrix (BFS)
- Gas station / first non-repeating character in a stream (queue + counts)
- Task scheduler (heap + queue)

> [!WARNING]
> Typical mistakes:
> - Using `list.pop(0)` → O(n²) BFS.
> - Forgetting to mark nodes as visited **when enqueuing** (not when dequeuing) → duplicates in the queue.
> - In monotonic deques, storing values instead of indices, so you can't tell when an item left the window.

> [!REMEMBER]
> `deque` for every queue. BFS = queue + visited set (mark on enqueue). Monotonic deque gives O(n) window max/min. Process `len(q)` items per loop for level-by-level BFS.
