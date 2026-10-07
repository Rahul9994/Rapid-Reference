Hashing trades memory for speed: store what you've seen in a hash map or set so later lookups take O(1) on average. It's the single most common optimisation from O(n²) to O(n).

## Concept

A **hash function** maps a key to a bucket index. A hash table stores key → value pairs in buckets.

```diagram Hash table with separate chaining
 key "cat" ─ hash() → 2
 buckets:  0: []
           1: [("dog", 4)]
           2: [("cat", 7), ("act", 1)]   ← collision: same bucket, chained
           3: []
```

- **Collision**: two keys land in the same bucket. Resolved by **chaining** (lists per bucket) or **open addressing** (probe for another slot — CPython's dict uses this).
- **Load factor** = items / buckets. Tables resize when it grows too large, keeping operations O(1) amortized.
- Python: `dict` (key → value), `set` (keys only), `Counter`, `defaultdict`.

## Core intuition

Whenever you find yourself scanning the array again to look for something ("does a complement exist?", "how many times have I seen this?", "where did I last see this?"), store it in a hash map as you go.

## Important patterns

### 1. Complement lookup — Two Sum

```python
def two_sum(nums, target):
    seen = {}                       # value → index
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

print(two_sum([2, 7, 11, 15], 9))   # [0, 1]
```

### 2. Frequency counting

```python
from collections import Counter

def top_k_frequent(nums, k):
    return [x for x, _ in Counter(nums).most_common(k)]

def first_unique_char(s):
    freq = Counter(s)
    for i, ch in enumerate(s):
        if freq[ch] == 1:
            return i
    return -1

print(top_k_frequent([1, 1, 1, 2, 2, 3], 2), first_unique_char("leetcode"))   # [1, 2] 0
```

### 3. Prefix sum + hash map

Store the **first index** of each prefix sum to find the longest subarray with sum K (works with negatives):

```python
def longest_subarray_sum_k(nums, k):
    first = {0: -1}
    total = best = 0
    for i, x in enumerate(nums):
        total += x
        if total - k in first:
            best = max(best, i - first[total - k])
        first.setdefault(total, i)          # keep the earliest index
    return best

print(longest_subarray_sum_k([1, -1, 5, -2, 3], 3))   # 4 → [1, -1, 5, -2]
```

Variants: count subarrays with sum K (store counts), longest subarray with equal 0s and 1s (map 0 → −1), subarrays with XOR K (prefix XOR).

```python
def count_xor_k(nums, k):
    from collections import defaultdict
    count = defaultdict(int); count[0] = 1
    px = ans = 0
    for x in nums:
        px ^= x
        ans += count[px ^ k]
        count[px] += 1
    return ans

print(count_xor_k([4, 2, 2, 6, 4], 6))   # 4
```

### 4. Grouping by a canonical key

```python
from collections import defaultdict

def group_shifted(strings):
    groups = defaultdict(list)
    for s in strings:
        key = tuple((ord(c) - ord(s[0])) % 26 for c in s)   # shape of the string
        groups[key].append(s)
    return list(groups.values())

print(group_shifted(["abc", "bcd", "az", "ba", "x"]))
```

### 5. Hash set for O(1) existence — longest consecutive sequence

```python
def longest_consecutive(nums):
    s, best = set(nums), 0
    for x in s:
        if x - 1 not in s:                 # only start counting at the beginning of a run
            length = 1
            while x + length in s:
                length += 1
            best = max(best, length)
    return best

print(longest_consecutive([100, 4, 200, 1, 3, 2]))   # 4
```

### 6. Index map for "last seen" questions

```python
def contains_nearby_duplicate(nums, k):
    last = {}
    for i, x in enumerate(nums):
        if x in last and i - last[x] <= k:
            return True
        last[x] = i
    return False
```

### 7. Implementing a hash map (interview favourite)

```python
class MyHashMap:
    def __init__(self, capacity=1024):
        self.buckets = [[] for _ in range(capacity)]

    def _bucket(self, key):
        return self.buckets[hash(key) % len(self.buckets)]

    def put(self, key, value):
        bucket = self._bucket(key)
        for pair in bucket:
            if pair[0] == key:
                pair[1] = value
                return
        bucket.append([key, value])

    def get(self, key, default=-1):
        for k, v in self._bucket(key):
            if k == key:
                return v
        return default

    def remove(self, key):
        bucket = self._bucket(key)
        bucket[:] = [p for p in bucket if p[0] != key]
```

## Complexity

| Operation | Average | Worst (many collisions) |
|---|---|---|
| insert / lookup / delete | O(1) | O(n) |
| iterate | O(n) | O(n) |
| space | O(n) | O(n) |

## Common interview variations

- Two Sum, 4Sum II, count pairs with given difference
- Longest consecutive sequence, contains duplicate I/II
- Subarray sum equals K, longest subarray with sum K, subarrays with XOR K
- Group anagrams, isomorphic strings, word pattern
- Design HashMap/HashSet, LRU cache (hash map + doubly linked list)

> [!WARNING]
> Typical mistakes:
> - Inserting the current element **before** checking for its complement (finds `x + x = target` with a single element).
> - Overwriting the first index of a prefix sum when you need the earliest one (`setdefault`).
> - Using unhashable keys (lists) — convert to tuples.
> - Assuming dict/set iteration gives sorted order.

> [!REMEMBER]
> "Have I seen X?" → set. "How many / where?" → dict. Prefix sum + map handles subarray sums with negatives. Average O(1), worst O(n).
