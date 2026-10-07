A recursive function solves a problem by calling itself on a smaller version of the same problem. It's the foundation of trees, backtracking, divide-and-conquer and dynamic programming.

## Anatomy of a recursive function

Every correct recursion has:

1. **Base case(s)** — inputs answered directly, without recursion.
2. **Recursive case** — reduce the problem and trust the recursive call.
3. **Progress** — each call must move toward a base case.

```python
def factorial(n):
    if n <= 1:                 # base case
        return 1
    return n * factorial(n - 1)   # recursive case, n shrinks

print(factorial(5))   # 120
```

## The call stack

Each call gets its own **stack frame** holding its local variables. Frames are popped as calls return.

```diagram factorial(3) on the call stack
 call factorial(3)            returns 3 * 2 = 6
   └─ call factorial(2)       returns 2 * 1 = 2
        └─ call factorial(1)  returns 1   (base case)
```

Space complexity of recursion ≥ **maximum depth** of the call stack.

## Recursion limit

CPython limits recursion depth (default **1000**) to avoid crashing the interpreter.

```python
import sys
print(sys.getrecursionlimit())     # 1000
sys.setrecursionlimit(10**6)       # raise for deep DFS — use with care
```

> [!WARNING]
> Raising the limit doesn't make the C stack bigger. Very deep recursion (≈10⁵+ frames) can still crash with a segmentation fault. For deep inputs (long linked lists, path graphs), prefer an **iterative** solution with an explicit stack.

```python
import threading, sys

def solve():
    ...  # deep recursive DFS here

sys.setrecursionlimit(1 << 25)
threading.stack_size(1 << 27)      # 128 MB stack for the new thread
threading.Thread(target=solve).start()
```

Python does **not** do tail-call optimisation, so tail recursion still grows the stack.

## Classic patterns

### 1. Reduce by one (linear recursion)

```python
def sum_list(nums, i=0):
    if i == len(nums):
        return 0
    return nums[i] + sum_list(nums, i + 1)
```

### 2. Divide and conquer (halve the problem)

```python
def power(x, n):
    """x ** n in O(log n) multiplications."""
    if n == 0:
        return 1
    half = power(x, n // 2)
    return half * half if n % 2 == 0 else half * half * x

print(power(2, 30))   # 1073741824
```

### 3. Multiple branches (tree recursion)

```python
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)   # O(2^n) — exponential!
```

```diagram Recursion tree of fib(4): repeated subproblems
                 fib(4)
              /         \
          fib(3)        fib(2)
         /     \        /    \
     fib(2)  fib(1)  fib(1) fib(0)
     /    \
 fib(1) fib(0)
```

### 4. Pick / not-pick (subsequences)

```python
def subsets(nums):
    res, cur = [], []
    def go(i):
        if i == len(nums):
            res.append(cur[:])     # copy!
            return
        cur.append(nums[i])        # pick
        go(i + 1)
        cur.pop()                  # undo
        go(i + 1)                  # not pick
    go(0)
    return res

print(subsets([1, 2]))   # [[1, 2], [1], [2], []]
```

## Memoization: recursion + cache

Cache results of subproblems so each is computed once.

```python
from functools import lru_cache   # or functools.cache (3.9+)

@lru_cache(maxsize=None)
def fib(n):
    if n < 2:
        return n
    return fib(n - 1) + fib(n - 2)

print(fib(90))   # 2880067194370816120 — instant, O(n)
```

Manual memo with a dict:

```python
def fib(n, memo={}):          # mutable default used *intentionally* as a cache
    if n < 2:
        return n
    if n not in memo:
        memo[n] = fib(n - 1, memo) + fib(n - 2, memo)
    return memo[n]
```

> [!TIP]
> `@lru_cache` requires hashable arguments — convert lists to tuples before passing them in. Call `fib.cache_clear()` between independent test cases.

## Converting recursion to iteration

```python
def fib_iter(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a

def dfs_iter(graph, start):
    seen, stack = {start}, [start]
    order = []
    while stack:
        node = stack.pop()
        order.append(node)
        for nxt in reversed(graph[node]):
            if nxt not in seen:
                seen.add(nxt)
                stack.append(nxt)
    return order
```

## Analysing recursive complexity

| Recurrence | Example | Time |
|---|---|---|
| T(n) = T(n−1) + O(1) | factorial, linked-list traversal | O(n) |
| T(n) = T(n/2) + O(1) | binary search, fast power | O(log n) |
| T(n) = 2T(n/2) + O(n) | merge sort | O(n log n) |
| T(n) = 2T(n−1) + O(1) | naive fib, subsets | O(2ⁿ) |
| T(n) = n·T(n−1) | permutations | O(n!) |

Rule of thumb: **time ≈ (number of calls) × (work per call)**; **space ≈ max depth** (+ memo size).

> [!WARNING]
> - Missing or unreachable base case → `RecursionError: maximum recursion depth exceeded`.
> - Appending `cur` instead of `cur[:]` → every saved result is the same (later emptied) list.
> - Forgetting to undo state (`pop()`) after a recursive call in backtracking.

> [!INTERVIEW]
> - Explain recursion with the **leap of faith**: assume the call works for smaller inputs; just combine.
> - Python has no tail-call optimisation; default limit is 1000.
> - Memoization turns exponential tree recursion into polynomial DP.

> [!REMEMBER]
> Base case → shrink → combine. Draw the recursion tree to get time complexity, use depth for space, memoize overlapping subproblems, and go iterative when depth can exceed ~10⁴.
