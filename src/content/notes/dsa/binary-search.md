Binary search halves the search space each step, giving O(log n). It works on any **monotonic** condition — not just "find x in a sorted array". Recognising "binary search on the answer" is one of the highest-leverage interview skills.

## Concept

Requirement: a predicate `ok(x)` that is `False … False True … True` (or the reverse) over the search range. Binary search finds the boundary.

```diagram Search space shrinking
 lo                    mid                    hi
 [ F F F F F F F F F F T T T T T T T T T T T ]
                       ↑ ok(mid) → answer is mid or left of it → hi = mid - 1
```

## Core intuition

Each comparison discards half the candidates: n → n/2 → n/4 → … → 1 takes log₂ n steps. For n = 10⁹, that's just ~30 steps.

## Important patterns

### 1. Classic search

```python
def binary_search(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2          # Python ints don't overflow; in C++/Java use lo + (hi - lo) // 2
        if nums[mid] == target:
            return mid
        if nums[mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1

print(binary_search([1, 3, 5, 7, 9, 11], 7))   # 3
```

### 2. Lower bound / upper bound

```python
def lower_bound(nums, x):        # first index with nums[i] >= x
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo

def upper_bound(nums, x):        # first index with nums[i] > x
    lo, hi = 0, len(nums)
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] <= x:
            lo = mid + 1
        else:
            hi = mid
    return lo

a = [1, 2, 2, 2, 5, 7]
print(lower_bound(a, 2), upper_bound(a, 2))      # 1 4
print(upper_bound(a, 2) - lower_bound(a, 2))     # count of 2s → 3
```

These are exactly `bisect.bisect_left` and `bisect.bisect_right`. From them you get: first/last occurrence, floor/ceil of x, insert position, count of occurrences.

### 3. Search in a rotated sorted array

One half is always sorted — check whether the target lies inside it.

```python
def search_rotated(nums, target):
    lo, hi = 0, len(nums) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if nums[mid] == target:
            return mid
        if nums[lo] <= nums[mid]:                      # left half sorted
            if nums[lo] <= target < nums[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:                                          # right half sorted
            if nums[mid] < target <= nums[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1

def find_min_rotated(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] > nums[hi]:
            lo = mid + 1        # minimum is to the right
        else:
            hi = mid
    return nums[lo]

print(search_rotated([4, 5, 6, 7, 0, 1, 2], 0), find_min_rotated([4, 5, 6, 7, 0, 1, 2]))   # 4 0
```

> [!NOTE]
> With duplicates (`[3, 1, 3, 3, 3]`), when `nums[lo] == nums[mid] == nums[hi]` you can't tell which half is sorted — shrink with `lo += 1; hi -= 1` (worst case O(n)).

### 4. Peak element

```python
def find_peak(nums):
    lo, hi = 0, len(nums) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if nums[mid] < nums[mid + 1]:
            lo = mid + 1          # an ascent → a peak exists on the right
        else:
            hi = mid
    return lo

print(find_peak([1, 2, 1, 3, 5, 6, 4]))   # 5 (value 6) — any peak is accepted
```

### 5. Binary search on the answer

When the question asks for the **minimum (or maximum) value** such that something is feasible, and feasibility is monotonic in that value.

```python
def first_true(lo, hi, ok):
    """Smallest x in [lo, hi] with ok(x) True (ok is False...False True...True)."""
    while lo < hi:
        mid = (lo + hi) // 2
        if ok(mid):
            hi = mid
        else:
            lo = mid + 1
    return lo
```

**Koko eating bananas** — minimum speed to finish within h hours:

```python
def min_eating_speed(piles, h):
    def can_finish(speed):
        return sum(-(-p // speed) for p in piles) <= h    # ceil(p / speed)
    return first_true(1, max(piles), can_finish)

print(min_eating_speed([3, 6, 7, 11], 8))   # 4
```

**Split array largest sum / allocate books / painter's partition** — minimise the maximum load:

```python
def split_array(nums, k):
    def feasible(cap):                    # can we split into ≤ k parts with sum ≤ cap?
        parts, cur = 1, 0
        for x in nums:
            if cur + x > cap:
                parts += 1
                cur = 0
            cur += x
        return parts <= k
    return first_true(max(nums), sum(nums), feasible)

print(split_array([7, 2, 5, 10, 8], 2))   # 18 → [7, 2, 5] and [10, 8]
```

**Aggressive cows** — maximise the minimum distance (search for the *last* true):

```python
def aggressive_cows(stalls, cows):
    stalls.sort()
    def can_place(d):
        count, last = 1, stalls[0]
        for s in stalls[1:]:
            if s - last >= d:
                count += 1
                last = s
        return count >= cows
    lo, hi = 1, stalls[-1] - stalls[0]
    while lo < hi:
        mid = (lo + hi + 1) // 2          # upper mid to avoid an infinite loop
        if can_place(mid):
            lo = mid
        else:
            hi = mid - 1
    return lo

print(aggressive_cows([1, 2, 4, 8, 9], 3))   # 3
```

### 6. Square root and precision search

```python
def isqrt(n):                       # floor(sqrt(n)) with integers only
    lo, hi = 0, n
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if mid * mid <= n:
            lo = mid
        else:
            hi = mid - 1
    return lo

def nth_root(x, n, eps=1e-9):        # real-valued search
    lo, hi = 0.0, max(1.0, x)
    while hi - lo > eps:
        mid = (lo + hi) / 2
        if mid ** n < x:
            lo = mid
        else:
            hi = mid
    return lo

print(isqrt(27), round(nth_root(27, 3), 6))   # 5 3.0
```

### 7. 2D matrix

```python
def search_matrix(matrix, target):          # rows sorted, each row's first > previous row's last
    m, n = len(matrix), len(matrix[0])
    lo, hi = 0, m * n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        val = matrix[mid // n][mid % n]     # treat as a flattened array
        if val == target:
            return True
        if val < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False

def search_matrix_ii(matrix, target):       # rows and columns sorted independently
    r, c = 0, len(matrix[0]) - 1            # start at top-right
    while r < len(matrix) and c >= 0:
        if matrix[r][c] == target:
            return True
        if matrix[r][c] > target:
            c -= 1
        else:
            r += 1
    return False                            # O(m + n)
```

### 8. Median of two sorted arrays (O(log min(m, n)))

```python
def find_median_sorted_arrays(a, b):
    if len(a) > len(b):
        a, b = b, a
    m, n = len(a), len(b)
    lo, hi, half = 0, m, (m + n + 1) // 2
    while lo <= hi:
        i = (lo + hi) // 2                 # elements taken from a
        j = half - i                       # elements taken from b
        a_left = a[i - 1] if i > 0 else float("-inf")
        a_right = a[i] if i < m else float("inf")
        b_left = b[j - 1] if j > 0 else float("-inf")
        b_right = b[j] if j < n else float("inf")
        if a_left <= b_right and b_left <= a_right:
            if (m + n) % 2:
                return max(a_left, b_left)
            return (max(a_left, b_left) + min(a_right, b_right)) / 2
        if a_left > b_right:
            hi = i - 1
        else:
            lo = i + 1

print(find_median_sorted_arrays([1, 3], [2, 4]))   # 2.5
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Search / bounds / rotated / peak | O(log n) | O(1) |
| Binary search on answer | O(log(range) × cost of check) | O(1) |
| Matrix (flattened) | O(log(m·n)) | O(1) |
| Median of two arrays | O(log min(m, n)) | O(1) |

## Common interview variations

- First and last position of an element, count occurrences, search insert position
- Minimum in rotated array, number of rotations, single element in a sorted array
- Koko bananas, ship packages within D days, minimum days to make bouquets
- Allocate books, split array largest sum, painter's partition, aggressive cows
- k-th missing positive number, median of a row-wise sorted matrix
- Row with maximum 1s, peak element in 2D

> [!WARNING]
> Typical mistakes:
> - Mixing loop styles: `while lo <= hi` pairs with `hi = mid - 1`; `while lo < hi` pairs with `hi = mid`.
> - Infinite loop when using `lo = mid` with the lower mid — use `mid = (lo + hi + 1) // 2`.
> - Wrong search bounds for the answer (e.g. minimum should be `max(nums)`, not 0).
> - Forgetting that the predicate must be monotonic.

> [!REMEMBER]
> Find the monotonic predicate, pick the range of answers, binary search the boundary. Lower bound = first ≥ x, upper bound = first > x. Minimise → first true; maximise → last true with upper mid.
