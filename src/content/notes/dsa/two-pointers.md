Two pointers walk through a sequence in a coordinated way to avoid a nested loop. It usually turns an O(n²) brute force into O(n) — especially on **sorted** arrays and linked lists.

## Concept

| Variant | Pointers start | Typical use |
|---|---|---|
| Opposite ends | `i = 0`, `j = n − 1`, move inward | pair sums on sorted arrays, palindromes, container with most water |
| Same direction (read/write) | both at 0, one is the "writer" | remove duplicates, move zeroes, partitioning |
| Fast & slow | slow moves 1, fast moves 2 | cycle detection, middle of a linked list |
| Two sequences | one pointer per array | merge sorted arrays, intersection |

## Core intuition

With a sorted array, comparing `a[i] + a[j]` with the target tells you **which pointer to move**: too small → move `i` right (increase), too big → move `j` left (decrease). Each step discards a whole row/column of the brute-force search space.

## Important patterns

### 1. Pair sum in a sorted array

```python
def pair_sum_sorted(nums, target):
    i, j = 0, len(nums) - 1
    while i < j:
        s = nums[i] + nums[j]
        if s == target:
            return [i, j]
        if s < target:
            i += 1
        else:
            j -= 1
    return []

print(pair_sum_sorted([1, 3, 4, 6, 9], 10))   # [0, 4]
```

### 2. 3Sum (sort + two pointers, skip duplicates)

```python
def three_sum(nums):
    nums.sort()
    res = []
    for k in range(len(nums) - 2):
        if k and nums[k] == nums[k - 1]:
            continue                          # skip duplicate anchors
        i, j = k + 1, len(nums) - 1
        while i < j:
            s = nums[k] + nums[i] + nums[j]
            if s < 0:
                i += 1
            elif s > 0:
                j -= 1
            else:
                res.append([nums[k], nums[i], nums[j]])
                i += 1; j -= 1
                while i < j and nums[i] == nums[i - 1]:
                    i += 1                    # skip duplicate second elements
    return res

print(three_sum([-1, 0, 1, 2, -1, -4]))   # [[-1, -1, 2], [-1, 0, 1]]
```

O(n²) time — 4Sum adds one more outer loop (O(n³)).

### 3. Read/write pointers — remove duplicates in place

```python
def remove_duplicates(nums):
    if not nums:
        return 0
    w = 1                                # next write position
    for r in range(1, len(nums)):
        if nums[r] != nums[w - 1]:
            nums[w] = nums[r]
            w += 1
    return w                             # new length

a = [1, 1, 2, 3, 3]
k = remove_duplicates(a)
print(k, a[:k])                          # 3 [1, 2, 3]

def move_zeroes(nums):
    w = 0
    for r in range(len(nums)):
        if nums[r] != 0:
            nums[w], nums[r] = nums[r], nums[w]
            w += 1
    return nums

print(move_zeroes([0, 1, 0, 3, 12]))     # [1, 3, 12, 0, 0]
```

### 4. Container with most water

```python
def max_area(height):
    i, j, best = 0, len(height) - 1, 0
    while i < j:
        best = max(best, (j - i) * min(height[i], height[j]))
        if height[i] < height[j]:      # the shorter wall limits area → move it
            i += 1
        else:
            j -= 1
    return best

print(max_area([1, 8, 6, 2, 5, 4, 8, 3, 7]))   # 49
```

### 5. Trapping rain water (two pointers, O(1) space)

```python
def trap(height):
    i, j = 0, len(height) - 1
    left_max = right_max = water = 0
    while i < j:
        if height[i] < height[j]:
            left_max = max(left_max, height[i])
            water += left_max - height[i]
            i += 1
        else:
            right_max = max(right_max, height[j])
            water += right_max - height[j]
            j -= 1
    return water

print(trap([0, 1, 0, 2, 1, 0, 1, 3, 2, 1, 2, 1]))   # 6
```

### 6. Merge two sorted arrays

```python
def merge_sorted(a, b):
    i = j = 0
    out = []
    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:]); out.extend(b[j:])
    return out

print(merge_sorted([1, 4, 7], [2, 3, 9]))   # [1, 2, 3, 4, 7, 9]
```

In-place variant (LeetCode "Merge Sorted Array"): fill from the **back** so nothing is overwritten.

### 7. Fast & slow pointers

```python
def middle_index(n):            # on arrays it's trivial; shown for the idea
    slow = fast = 0
    while fast + 1 < n:
        slow += 1
        fast += 2
    return slow

def find_duplicate(nums):       # Floyd's cycle detection on index → value links
    slow = fast = nums[0]
    while True:
        slow = nums[slow]
        fast = nums[nums[fast]]
        if slow == fast:
            break
    slow = nums[0]
    while slow != fast:
        slow = nums[slow]
        fast = nums[fast]
    return slow

print(find_duplicate([1, 3, 4, 2, 2]))   # 2
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Pair sum (sorted) | O(n) | O(1) |
| 3Sum | O(n²) | O(1) extra (excluding output) |
| Remove duplicates / move zeroes | O(n) | O(1) |
| Container with most water / trapping rain water | O(n) | O(1) |
| Merge two sorted arrays | O(n + m) | O(n + m) |

## Common interview variations

- Two Sum II (sorted), 3Sum, 3Sum closest, 4Sum
- Valid palindrome (skip non-alphanumerics), valid palindrome II (one deletion)
- Sort colors, partition array, squares of a sorted array
- Remove element, remove duplicates (allow ≤ 2)
- Linked list: middle node, cycle detection, remove N-th from end, palindrome list

> [!WARNING]
> Typical mistakes:
> - Applying opposite-end two pointers to an **unsorted** array (sort first, or use hashing).
> - Infinite loops when no pointer moves in some branch.
> - Duplicate triplets in 3Sum — skip equal neighbours after sorting.
> - Using `i <= j` vs `i < j` incorrectly (pairs need two distinct indices).

> [!REMEMBER]
> Sorted + pair condition → opposite ends. In-place filtering → read/write pointers. Cycles and middles → fast/slow. Each step must eliminate candidates, guaranteeing O(n).
