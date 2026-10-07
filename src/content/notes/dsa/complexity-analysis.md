Complexity analysis predicts how an algorithm's running time and memory grow with input size. It's how you compare approaches before writing code — and the first thing interviewers ask after you finish.

## Concept

**Asymptotic notation** describes growth for large inputs, ignoring constants and lower-order terms.

| Notation | Meaning | Analogy |
|---|---|---|
| **O(f(n))** | upper bound — grows *at most* like f(n) | "≤" |
| **Ω(f(n))** | lower bound — grows *at least* like f(n) | "≥" |
| **Θ(f(n))** | tight bound — both O and Ω | "=" |

In interviews, "complexity" usually means the **worst-case Big-O**.

```diagram Growth rates (slow → fast)
 O(1) < O(log n) < O(√n) < O(n) < O(n log n) < O(n²) < O(n³) < O(2ⁿ) < O(n!)
```

## Core intuition

- Count the **dominant operation** as a function of n.
- Drop constants: `3n + 5` → O(n).
- Keep the biggest term: `n² + n log n` → O(n²).
- Different inputs get different variables: two arrays of sizes n and m → O(n + m), not O(n).

## Important patterns

### Loops

```python
for i in range(n):            # O(n)
    pass

for i in range(n):            # O(n²)
    for j in range(n):
        pass

for i in range(n):            # O(n²) — still quadratic: n(n−1)/2 iterations
    for j in range(i + 1, n):
        pass

i = 1
while i < n:                  # O(log n) — i doubles
    i *= 2

for i in range(n):            # O(n log n)
    j = 1
    while j < n:
        j *= 2
```

### Sequential vs nested

```python
def f(a, b):
    for x in a:   # O(n)
        pass
    for y in b:   # O(m)
        pass
    # total: O(n + m)

def g(a, b):
    for x in a:
        for y in b:
            pass  # total: O(n · m)
```

### Recursion

**Time ≈ number of calls × work per call. Space ≈ max recursion depth.**

| Recurrence | Solution | Example |
|---|---|---|
| T(n) = T(n − 1) + O(1) | O(n) | factorial |
| T(n) = T(n − 1) + O(n) | O(n²) | selection sort recursion |
| T(n) = T(n/2) + O(1) | O(log n) | binary search |
| T(n) = 2T(n/2) + O(1) | O(n) | tree traversal |
| T(n) = 2T(n/2) + O(n) | O(n log n) | merge sort |
| T(n) = 2T(n − 1) + O(1) | O(2ⁿ) | naive Fibonacci, subsets |

### Master theorem (divide and conquer)

For T(n) = a·T(n/b) + O(n^d):

| Case | Result |
|---|---|
| d > log_b(a) | O(n^d) |
| d = log_b(a) | O(n^d · log n) |
| d < log_b(a) | O(n^(log_b a)) |

Merge sort: a = 2, b = 2, d = 1 → d = log₂2 → **O(n log n)**.

### Amortized analysis

Some operations are occasionally expensive but cheap on average. Appending to a dynamic array costs O(n) when it resizes, but resizes happen so rarely (capacity doubles) that n appends cost O(n) total → **O(1) amortized** per append.

## Space complexity

Count **extra** memory used besides the input:

```python
def reverse_copy(a):
    return a[::-1]        # O(n) extra space

def reverse_in_place(a):
    i, j = 0, len(a) - 1  # O(1) extra space
    while i < j:
        a[i], a[j] = a[j], a[i]
        i += 1; j -= 1
```

Recursion depth, hash maps, visited sets, DP tables and output arrays all count.

## Complexity from constraints

| n up to | Acceptable complexity | Typical approach |
|---|---|---|
| 10 | O(n!) | permutations |
| 20–25 | O(2ⁿ) | subsets, bitmask DP |
| 100 | O(n³) – O(n⁴) | Floyd-Warshall, interval DP |
| 1,000–5,000 | O(n²) | 2D DP, double loops |
| 10⁵ – 10⁶ | O(n log n) | sorting, heaps, binary search |
| 10⁷+ | O(n) / O(log n) | linear scans, math |

## Common interview variations

- "What's the complexity of your solution?" — give time **and** space, explain why.
- "Can you do better?" — look for repeated work (hashing, sorting, prefix sums, DP).
- Best vs average vs worst case: quicksort is O(n log n) average, O(n²) worst.
- Hash tables: O(1) average, O(n) worst case.

> [!WARNING]
> Typical mistakes:
> - Calling an O(n) operation inside a loop (`x in list`, `list.pop(0)`, slicing) and still claiming O(n).
> - Forgetting recursion stack space.
> - Writing O(n + m) as O(n) when the inputs are independent.
> - Saying sorting is O(n) — comparison sorts are Ω(n log n).

> [!REMEMBER]
> Drop constants, keep the dominant term, multiply nested work, add sequential work, use the recursion tree (calls × work) for recursive code, and check the constraints to know what complexity you need.
