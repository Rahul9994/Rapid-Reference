A greedy algorithm builds a solution by repeatedly taking the **locally best** choice and never looking back. It's fast and simple — but only correct when the problem has the right structure, so you must be able to justify it.

## Concept

Greedy works when two properties hold:

1. **Greedy-choice property** — some optimal solution begins with the greedy choice.
2. **Optimal substructure** — after making that choice, the rest is a smaller instance of the same problem.

| Greedy works | Greedy fails (use DP) |
|---|---|
| Activity selection (earliest finish) | 0/1 knapsack |
| Fractional knapsack | Coin change with arbitrary denominations |
| Huffman coding | Longest path in a general graph |
| Dijkstra (non-negative weights), Prim, Kruskal | Weighted interval scheduling |

## Core intuition: the exchange argument

To prove a greedy rule, take any optimal solution that differs from the greedy one and show you can **swap** in the greedy choice without making it worse. If you can't find such an argument — or you find a counterexample — reach for DP.

> [!WARNING]
> Coin change with coins `[1, 3, 4]` and amount 6: greedy picks 4 + 1 + 1 (3 coins), but 3 + 3 (2 coins) is optimal. Always test greedy ideas on small adversarial cases.

## Important patterns

### 1. Interval scheduling — sort by end time

Maximum number of non-overlapping meetings:

```python
def max_meetings(intervals):
    count, last_end = 0, float("-inf")
    for start, end in sorted(intervals, key=lambda iv: iv[1]):
        if start >= last_end:          # compatible with the last chosen meeting
            count += 1
            last_end = end
    return count

def erase_overlap_intervals(intervals):  # minimum removals = total − maximum kept
    return len(intervals) - max_meetings(intervals)

print(max_meetings([(1, 2), (3, 4), (0, 6), (5, 7), (8, 9), (5, 9)]))   # 4
print(erase_overlap_intervals([[1, 2], [2, 3], [3, 4], [1, 3]]))        # 1
```

Why end time? Finishing earliest leaves the most room for the rest (exchange argument).

### 2. Minimum platforms / meeting rooms (sweep line)

```python
def min_platforms(arrivals, departures):
    arrivals, departures = sorted(arrivals), sorted(departures)
    i = j = cur = best = 0
    while i < len(arrivals):
        if arrivals[i] <= departures[j]:     # a train arrives before the next one leaves
            cur += 1; i += 1
            best = max(best, cur)
        else:
            cur -= 1; j += 1
    return best

print(min_platforms([900, 940, 950, 1100, 1500, 1800], [910, 1200, 1120, 1130, 1900, 2000]))   # 3
```

### 3. Jump game

```python
def can_jump(nums):
    reach = 0
    for i, x in enumerate(nums):
        if i > reach:
            return False
        reach = max(reach, i + x)
    return True

def min_jumps(nums):                       # BFS-by-levels in O(n)
    jumps = cur_end = farthest = 0
    for i in range(len(nums) - 1):
        farthest = max(farthest, i + nums[i])
        if i == cur_end:
            jumps += 1
            cur_end = farthest
    return jumps

print(can_jump([3, 2, 1, 0, 4]), min_jumps([2, 3, 1, 1, 4]))   # False 2
```

### 4. Fractional knapsack — best value per weight first

```python
def fractional_knapsack(items, capacity):
    total = 0.0
    for value, weight in sorted(items, key=lambda it: it[0] / it[1], reverse=True):
        take = min(weight, capacity)
        total += value * take / weight
        capacity -= take
        if capacity == 0:
            break
    return total

print(fractional_knapsack([(60, 10), (100, 20), (120, 30)], 50))   # 240.0
```

### 5. Job sequencing with deadlines

```python
def job_sequencing(jobs):                   # (id, deadline, profit)
    jobs = sorted(jobs, key=lambda j: j[2], reverse=True)
    max_d = max(j[1] for j in jobs)
    slot = [None] * (max_d + 1)
    count = profit = 0
    for jid, deadline, p in jobs:
        for t in range(deadline, 0, -1):    # latest free slot before the deadline
            if slot[t] is None:
                slot[t] = jid
                count += 1
                profit += p
                break
    return count, profit

print(job_sequencing([(1, 4, 20), (2, 1, 10), (3, 1, 40), (4, 1, 30)]))   # (2, 60)
```

(A DSU over slots makes the slot search near O(1).)

### 6. Assign cookies / two sorted lists

```python
def find_content_children(greed, cookies):
    greed.sort(); cookies.sort()
    child = 0
    for c in cookies:
        if child < len(greed) and c >= greed[child]:
            child += 1
    return child

print(find_content_children([1, 2, 3], [1, 1]))   # 1
```

### 7. Candy (two passes)

```python
def candy(ratings):
    n = len(ratings)
    c = [1] * n
    for i in range(1, n):                       # left neighbour constraint
        if ratings[i] > ratings[i - 1]:
            c[i] = c[i - 1] + 1
    for i in range(n - 2, -1, -1):              # right neighbour constraint
        if ratings[i] > ratings[i + 1]:
            c[i] = max(c[i], c[i + 1] + 1)
    return sum(c)

print(candy([1, 0, 2]), candy([1, 2, 2]))   # 5 4
```

### 8. Gas station

```python
def can_complete_circuit(gas, cost):
    if sum(gas) < sum(cost):
        return -1
    start = tank = 0
    for i in range(len(gas)):
        tank += gas[i] - cost[i]
        if tank < 0:                # can't reach i + 1 from any station in [start, i]
            start, tank = i + 1, 0
    return start

print(can_complete_circuit([1, 2, 3, 4, 5], [3, 4, 5, 1, 2]))   # 3
```

### 9. Valid parenthesis string with `*` (range of open counts)

```python
def check_valid_string(s):
    lo = hi = 0                     # min and max possible open brackets
    for ch in s:
        if ch == "(":
            lo += 1; hi += 1
        elif ch == ")":
            lo -= 1; hi -= 1
        else:                       # '*' can be '(', ')' or ''
            lo -= 1; hi += 1
        if hi < 0:
            return False
        lo = max(lo, 0)
    return lo == 0

print(check_valid_string("(*))"), check_valid_string(")("))   # True False
```

### 10. Huffman coding (heap-based greedy)

```python
import heapq

def huffman_cost(freqs):
    """Total bits = sum of all merge costs."""
    heapq.heapify(freqs)
    cost = 0
    while len(freqs) > 1:
        a, b = heapq.heappop(freqs), heapq.heappop(freqs)
        cost += a + b
        heapq.heappush(freqs, a + b)
    return cost

print(huffman_cost([5, 9, 12, 13, 16, 45]))   # 224
```

## Complexity

| Problem | Time | Space |
|---|---|---|
| Interval scheduling / platforms | O(n log n) | O(1)–O(n) |
| Jump game I/II | O(n) | O(1) |
| Fractional knapsack | O(n log n) | O(1) |
| Job sequencing | O(n log n + n·D) | O(D) |
| Candy, gas station | O(n) | O(n) / O(1) |
| Huffman | O(n log n) | O(n) |

## Common interview variations

- N meetings in one room, non-overlapping intervals, minimum arrows to burst balloons
- Insert interval, merge intervals, minimum platforms
- Jump game I/II, gas station, candy, lemonade change
- Shortest job first (average waiting time), page faults in LRU
- Minimum coins with canonical denominations (Indian currency)

> [!WARNING]
> Typical mistakes:
> - Sorting intervals by start instead of end for maximum non-overlapping selection.
> - Using greedy coin change with non-canonical coins.
> - Not proving correctness — say *why* the greedy choice is safe.

> [!REMEMBER]
> Sort by the right key (end time, ratio, deadline), take the best safe choice, justify with an exchange argument, and verify on a counterexample hunt. If greedy fails, it's usually DP.
