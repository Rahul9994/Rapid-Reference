Arrays are contiguous sequences with O(1) random access. In Python you use `list`. Most interview problems start here — and the same handful of patterns solves the majority of them.

## Concept

- Index-based access in O(1); insert/delete in the middle costs O(n) (shifting).
- Problems usually ask for a subarray (contiguous), a subsequence (order kept, not contiguous) or a rearrangement.

| Term | Contiguous? | Count for n elements |
|---|---|---|
| Subarray | Yes | n(n + 1)/2 |
| Subsequence | No (order kept) | 2ⁿ |
| Subset | No (order irrelevant) | 2ⁿ |

## Core intuition

Ask: *what do I re-compute repeatedly?* Prefix sums remove repeated range sums; hashing removes repeated searches; two pointers remove a nested loop on sorted data; Kadane removes recomputing subarray sums.

## Important patterns

### 1. Prefix sums — O(1) range sum queries

```python
def build_prefix(nums):
    prefix = [0] * (len(nums) + 1)
    for i, x in enumerate(nums):
        prefix[i + 1] = prefix[i] + x
    return prefix

nums = [3, 1, 4, 1, 5]
p = build_prefix(nums)
range_sum = lambda l, r: p[r + 1] - p[l]     # sum of nums[l..r]
print(range_sum(1, 3))                        # 1 + 4 + 1 = 6
```

### 2. Kadane's algorithm — maximum subarray sum

At each index, either extend the previous subarray or start fresh.

```python
def max_subarray(nums):
    best = cur = nums[0]
    for x in nums[1:]:
        cur = max(x, cur + x)      # extend or restart
        best = max(best, cur)
    return best

print(max_subarray([-2, 1, -3, 4, -1, 2, 1, -5, 4]))   # 6 → [4, -1, 2, 1]
```

### 3. Subarray sum equals K — prefix sum + hash map

```python
from collections import defaultdict

def subarray_sum(nums, k):
    count = defaultdict(int)
    count[0] = 1                   # empty prefix
    total = ans = 0
    for x in nums:
        total += x
        ans += count[total - k]    # earlier prefixes that make sum k
        count[total] += 1
    return ans

print(subarray_sum([1, 2, 3, -2, 2], 3))   # 4
```

The four subarrays are `[1, 2]`, `[3]`, `[2, 3, -2]` and `[3, -2, 2]`. Because `sum(l..r) = prefix[r] − prefix[l−1]`, a subarray ending here sums to k exactly when an earlier prefix equals `total − k` — so we count them without enumerating. This works with negative numbers, where sliding window does not.

### 4. Dutch National Flag — sort 0s, 1s, 2s in one pass

```python
def sort_colors(nums):
    low, mid, high = 0, 0, len(nums) - 1
    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1; mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1                # don't advance mid: the swapped value is unchecked
    return nums

print(sort_colors([2, 0, 2, 1, 1, 0]))   # [0, 0, 1, 1, 2, 2]
```

```diagram Invariant of the three pointers
 [ 0 0 0 | 1 1 1 | ? ? ? ? | 2 2 2 ]
   0..low-1  low..mid-1  mid..high  high+1..end
```

### 5. Moore's voting — majority element (> n/2)

```python
def majority(nums):
    cand, cnt = None, 0
    for x in nums:
        if cnt == 0:
            cand = x
        cnt += 1 if x == cand else -1
    return cand          # verify with nums.count(cand) if a majority isn't guaranteed

print(majority([2, 2, 1, 1, 1, 2, 2]))   # 2
```

### 6. Rotate by k with three reversals — O(1) space

```python
def rotate_right(nums, k):
    n = len(nums)
    k %= n
    def rev(i, j):
        while i < j:
            nums[i], nums[j] = nums[j], nums[i]
            i += 1; j -= 1
    rev(0, n - 1); rev(0, k - 1); rev(k, n - 1)
    return nums

print(rotate_right([1, 2, 3, 4, 5, 6, 7], 3))   # [5, 6, 7, 1, 2, 3, 4]
```

### 7. Next permutation

```python
def next_permutation(nums):
    i = len(nums) - 2
    while i >= 0 and nums[i] >= nums[i + 1]:   # find the first decreasing point from the right
        i -= 1
    if i >= 0:
        j = len(nums) - 1
        while nums[j] <= nums[i]:
            j -= 1
        nums[i], nums[j] = nums[j], nums[i]
    nums[i + 1:] = reversed(nums[i + 1:])        # smallest suffix
    return nums

print(next_permutation([1, 3, 5, 4, 2]))   # [1, 4, 2, 3, 5]
```

### 8. Best time to buy and sell stock (track the minimum so far)

```python
def max_profit(prices):
    lowest, best = float("inf"), 0
    for p in prices:
        lowest = min(lowest, p)
        best = max(best, p - lowest)
    return best

print(max_profit([7, 1, 5, 3, 6, 4]))   # 5
```

### 9. Merge overlapping intervals

```python
def merge(intervals):
    intervals.sort(key=lambda iv: iv[0])
    merged = []
    for start, end in intervals:
        if merged and start <= merged[-1][1]:
            merged[-1][1] = max(merged[-1][1], end)
        else:
            merged.append([start, end])
    return merged

print(merge([[1, 3], [8, 10], [2, 6], [15, 18]]))   # [[1, 6], [8, 10], [15, 18]]
```

### 10. Matrix: spiral order and in-place rotation

```python
def rotate_90(matrix):                 # clockwise, in place
    matrix.reverse()                   # flip vertically
    for i in range(len(matrix)):       # transpose
        for j in range(i):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]
    return matrix

def spiral(m):
    res = []
    while m:
        res += m.pop(0)                         # top row
        m = [list(row) for row in zip(*m)][::-1]   # rotate the rest counter-clockwise
    return res

print(rotate_90([[1, 2], [3, 4]]), spiral([[1, 2, 3], [4, 5, 6], [7, 8, 9]]))
```

```output
[[3, 1], [4, 2]] [1, 2, 3, 6, 9, 8, 7, 4, 5]
```

## Complexity

| Pattern | Time | Space |
|---|---|---|
| Prefix sums (build / query) | O(n) / O(1) | O(n) |
| Kadane | O(n) | O(1) |
| Prefix sum + hashmap | O(n) | O(n) |
| Dutch national flag | O(n) | O(1) |
| Moore's voting | O(n) | O(1) |
| Rotation by reversal | O(n) | O(1) |
| Merge intervals | O(n log n) | O(n) |

## Common interview variations

- Two Sum, 3Sum, 4Sum (hashing / sorting + two pointers)
- Maximum product subarray (track both max and min)
- Longest subarray with sum K (positives → sliding window; with negatives → prefix + hashmap)
- Leaders in an array (scan from the right)
- Set matrix zeroes, Pascal's triangle, majority element (> n/3)
- Count inversions, reverse pairs (merge sort)
- Missing and repeating numbers (math or XOR)

> [!WARNING]
> Typical mistakes:
> - Kadane initialised with `0` fails when all numbers are negative — start with `nums[0]`.
> - Forgetting `count[0] = 1` in prefix-sum counting.
> - Using `k` without `k %= n` in rotation.
> - Advancing `mid` after swapping with `high` in Dutch National Flag.

> [!REMEMBER]
> Range sums → prefix sums. Best subarray → Kadane. Count subarrays with sum K → prefix + hashmap. Three-way partition → Dutch flag. Majority → Moore. In-place rotation → three reversals.
