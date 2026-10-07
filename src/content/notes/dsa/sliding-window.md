Sliding window maintains a contiguous range `[left, right]` and updates its state incrementally as the window moves, instead of recomputing each subarray from scratch. Think "longest / shortest / count of subarrays or substrings that satisfy a condition".

## Concept

| Type | Window size | Movement |
|---|---|---|
| **Fixed** | exactly k | slide by one: add `a[right]`, remove `a[right − k]` |
| **Variable (longest)** | grows; shrinks only when invalid | expand right, shrink left while invalid |
| **Variable (shortest)** | shrinks while still valid | expand right until valid, then shrink as much as possible |
| **Counting** | "number of subarrays with ≤ / exactly K …" | count windows ending at `right`, use `atMost(K) − atMost(K−1)` |

## Core intuition

The window works when the condition is **monotonic**: if a window is invalid, every larger window containing it is also invalid (e.g. "sum ≤ k" with non-negative numbers, "at most k distinct characters"). Then each element enters and leaves the window at most once → **O(n)**.

> [!IMPORTANT]
> With **negative numbers**, "sum ≤ k" is not monotonic — use prefix sums + hash map (or a deque on prefix sums) instead.

## Important patterns

### 1. Fixed-size window

```python
def max_sum_k(nums, k):
    window = sum(nums[:k])
    best = window
    for right in range(k, len(nums)):
        window += nums[right] - nums[right - k]   # add new, drop old
        best = max(best, window)
    return best

print(max_sum_k([2, 1, 5, 1, 3, 2], 3))   # 9 → [5, 1, 3]
```

### 2. Longest substring without repeating characters

```python
def length_of_longest_substring(s):
    last = {}                  # char → last index seen
    left = best = 0
    for right, ch in enumerate(s):
        if ch in last and last[ch] >= left:
            left = last[ch] + 1          # jump past the previous occurrence
        last[ch] = right
        best = max(best, right - left + 1)
    return best

print(length_of_longest_substring("abcabcbb"))   # 3 → "abc"
```

### 3. Variable window template (longest valid)

```python
def longest_at_most_k_distinct(s, k):
    from collections import defaultdict
    count = defaultdict(int)
    left = best = 0
    for right, ch in enumerate(s):
        count[ch] += 1                         # 1. expand
        while len(count) > k:                  # 2. shrink while invalid
            count[s[left]] -= 1
            if count[s[left]] == 0:
                del count[s[left]]
            left += 1
        best = max(best, right - left + 1)     # 3. record answer (window is valid)
    return best

print(longest_at_most_k_distinct("eceba", 2))   # 3 → "ece"
```

The same template solves "fruit into baskets" (k = 2) and "longest repeating character replacement":

```python
def character_replacement(s, k):
    from collections import Counter
    count, left, max_freq, best = Counter(), 0, 0, 0
    for right, ch in enumerate(s):
        count[ch] += 1
        max_freq = max(max_freq, count[ch])
        if (right - left + 1) - max_freq > k:   # more than k replacements needed
            count[s[left]] -= 1
            left += 1
        best = max(best, right - left + 1)
    return best

print(character_replacement("AABABBA", 1))   # 4
```

### 4. Shortest valid window — minimum window substring

```python
from collections import Counter

def min_window(s, t):
    need = Counter(t)
    missing = len(t)                 # characters still needed
    left = 0
    best = (float("inf"), 0, 0)
    for right, ch in enumerate(s):
        if need[ch] > 0:
            missing -= 1
        need[ch] -= 1
        while missing == 0:          # valid → try to shrink
            if right - left + 1 < best[0]:
                best = (right - left + 1, left, right + 1)
            need[s[left]] += 1
            if need[s[left]] > 0:
                missing += 1
            left += 1
    return "" if best[0] == float("inf") else s[best[1]:best[2]]

print(min_window("ADOBECODEBANC", "ABC"))   # BANC
```

### 5. Counting subarrays: at most K → exactly K

```python
def subarrays_at_most_k_distinct(nums, k):
    from collections import defaultdict
    count = defaultdict(int)
    left = total = 0
    for right, x in enumerate(nums):
        count[x] += 1
        while len(count) > k:
            count[nums[left]] -= 1
            if count[nums[left]] == 0:
                del count[nums[left]]
            left += 1
        total += right - left + 1        # every window ending at `right`
    return total

def subarrays_exactly_k_distinct(nums, k):
    return subarrays_at_most_k_distinct(nums, k) - subarrays_at_most_k_distinct(nums, k - 1)

print(subarrays_exactly_k_distinct([1, 2, 1, 2, 3], 2))   # 7
```

Same trick: "binary subarrays with sum", "count number of nice subarrays".

### 6. Sliding window maximum (monotonic deque)

```python
from collections import deque

def max_sliding_window(nums, k):
    dq, res = deque(), []              # indices, values decreasing
    for i, x in enumerate(nums):
        while dq and nums[dq[-1]] <= x:
            dq.pop()                   # smaller elements can never be the max again
        dq.append(i)
        if dq[0] <= i - k:
            dq.popleft()               # out of the window
        if i >= k - 1:
            res.append(nums[dq[0]])
    return res

print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))   # [3, 3, 5, 5, 6, 7]
```

### 7. Fixed window with counts — find all anagrams

```python
from collections import Counter

def find_anagrams(s, p):
    k, need, win, res = len(p), Counter(p), Counter(), []
    for i, ch in enumerate(s):
        win[ch] += 1
        if i >= k:
            out = s[i - k]
            win[out] -= 1
            if win[out] == 0:
                del win[out]
        if win == need:
            res.append(i - k + 1)
    return res

print(find_anagrams("cbaebabacd", "abc"))   # [0, 6]
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Fixed window sum | O(n) | O(1) |
| Variable windows with a hash map | O(n) | O(k) or O(alphabet) |
| Minimum window substring | O(n + m) | O(alphabet) |
| Sliding window maximum | O(n) | O(k) |

## Common interview variations

- Maximum points from cards (window on the complement)
- Max consecutive ones III (at most k zeros)
- Longest subarray with sum ≤ K (non-negative numbers)
- Number of substrings containing all three characters
- Permutation in string, find all anagrams
- Minimum size subarray sum

> [!WARNING]
> Typical mistakes:
> - Using sliding window when elements can be negative and the condition is sum-based.
> - Updating the answer while the window is invalid.
> - In "last seen" windows, moving `left` backwards — guard with `last[ch] >= left` or `max(left, …)`.
> - Forgetting to delete zero counts, so `len(count)` stays wrong.

> [!REMEMBER]
> Expand right → shrink left while invalid → record. "Exactly K" = atMost(K) − atMost(K−1). Monotonic deque for window max/min. Every index enters and leaves once → O(n).
