Dynamic programming (DP) solves problems by combining answers to **overlapping subproblems**, computing each one only once. If a recursive solution recomputes the same states, DP turns exponential time into polynomial time.

## Concept

DP applies when a problem has:

1. **Optimal substructure** — the answer is built from answers to smaller subproblems.
2. **Overlapping subproblems** — the same subproblems appear again and again.

| Approach | How | Pros | Cons |
|---|---|---|---|
| **Memoization** (top-down) | recursion + cache | easy to derive from brute force | recursion depth, call overhead |
| **Tabulation** (bottom-up) | fill a table in dependency order | no recursion, easy space optimisation | must know the fill order |

## Core intuition: the 5-step recipe

1. **State** — what parameters identify a subproblem? (`i`, `(i, j)`, `(i, capacity)`…)
2. **Choices** — what decisions can you make at this state? (take / skip, match / don't…)
3. **Recurrence** — express the state's answer using smaller states.
4. **Base cases** — smallest states answered directly.
5. **Order & answer** — compute in an order where dependencies are ready; know which state is the answer.

> [!TIP]
> Write the recursive brute force first, add `@cache`, then convert to a table if needed. Interviewers love seeing that progression.

## Important patterns

### 1. 1D DP — climbing stairs / Fibonacci family

```python
from functools import cache

@cache
def climb(n):                       # ways to climb n steps taking 1 or 2 at a time
    if n <= 1:
        return 1
    return climb(n - 1) + climb(n - 2)

def climb_tab(n):                   # O(1) space
    a, b = 1, 1
    for _ in range(n - 1):
        a, b = b, a + b
    return b

print(climb(10), climb_tab(10))     # 89 89
```

**Frog jump** (min energy, jumps of 1 or 2):

```python
def frog_jump(h):
    prev2, prev1 = 0, 0                    # dp[i-2], dp[i-1]
    for i in range(1, len(h)):
        one = prev1 + abs(h[i] - h[i - 1])
        two = prev2 + abs(h[i] - h[i - 2]) if i > 1 else float("inf")
        prev2, prev1 = prev1, min(one, two)
    return prev1

print(frog_jump([10, 20, 30, 10]))   # 20
```

**House robber** (no two adjacent):

```python
def rob(nums):
    take, skip = 0, 0
    for x in nums:
        take, skip = skip + x, max(take, skip)
    return max(take, skip)

def rob_circular(nums):              # first and last are adjacent
    if len(nums) == 1:
        return nums[0]
    return max(rob(nums[1:]), rob(nums[:-1]))

print(rob([2, 7, 9, 3, 1]), rob_circular([2, 3, 2]))   # 12 3
```

### 2. 2D grid DP

```python
def unique_paths_with_obstacles(grid):
    R, C = len(grid), len(grid[0])
    dp = [0] * C
    dp[0] = 1 if grid[0][0] == 0 else 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == 1:
                dp[c] = 0
            elif c > 0:
                dp[c] += dp[c - 1]          # from top (old dp[c]) + from left
    return dp[-1]

def min_path_sum(grid):
    R, C = len(grid), len(grid[0])
    dp = [[0] * C for _ in range(R)]
    for r in range(R):
        for c in range(C):
            if r == c == 0:
                dp[r][c] = grid[0][0]
            else:
                up = dp[r - 1][c] if r else float("inf")
                left = dp[r][c - 1] if c else float("inf")
                dp[r][c] = grid[r][c] + min(up, left)
    return dp[-1][-1]

print(unique_paths_with_obstacles([[0, 0, 0], [0, 1, 0], [0, 0, 0]]), min_path_sum([[1, 3, 1], [1, 5, 1], [4, 2, 1]]))   # 2 7
```

### 3. 0/1 knapsack and subset sum

`dp[c]` = best value with capacity `c`. Iterate capacity **backwards** so each item is used at most once.

```python
def knapsack(weights, values, capacity):
    dp = [0] * (capacity + 1)
    for w, v in zip(weights, values):
        for c in range(capacity, w - 1, -1):     # backwards → 0/1
            dp[c] = max(dp[c], dp[c - w] + v)
    return dp[capacity]

def can_partition(nums):                          # equal subset sum partition
    total = sum(nums)
    if total % 2:
        return False
    target = total // 2
    reach = [True] + [False] * target
    for x in nums:
        for s in range(target, x - 1, -1):
            reach[s] = reach[s] or reach[s - x]
    return reach[target]

print(knapsack([1, 3, 4, 5], [1, 4, 5, 7], 7), can_partition([1, 5, 11, 5]))   # 9 True
```

**Unbounded** knapsack / coin change: iterate capacity **forwards** so items can repeat.

```python
def coin_change(coins, amount):                   # minimum coins
    dp = [0] + [float("inf")] * amount
    for c in coins:
        for a in range(c, amount + 1):            # forwards → unlimited coins
            dp[a] = min(dp[a], dp[a - c] + 1)
    return dp[amount] if dp[amount] != float("inf") else -1

def coin_change_ways(coins, amount):              # number of combinations
    dp = [1] + [0] * amount
    for c in coins:                               # coins outer → combinations (not permutations)
        for a in range(c, amount + 1):
            dp[a] += dp[a - c]
    return dp[amount]

print(coin_change([1, 3, 4], 6), coin_change_ways([1, 2, 5], 5))   # 2 4
```

### 4. Longest increasing subsequence (LIS)

```python
import bisect

def lis_n2(nums):                         # O(n²) DP — easy to extend (count, print)
    dp = [1] * len(nums)
    for i in range(len(nums)):
        for j in range(i):
            if nums[j] < nums[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp, default=0)

def lis_nlogn(nums):                      # patience sorting
    tails = []                            # tails[k] = smallest tail of an IS of length k+1
    for x in nums:
        i = bisect.bisect_left(tails, x)
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)

print(lis_n2([10, 9, 2, 5, 3, 7, 101, 18]), lis_nlogn([10, 9, 2, 5, 3, 7, 101, 18]))   # 4 4
```

### 5. Strings — LCS, edit distance

```python
def lcs(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]

def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i                      # delete all
    for j in range(n + 1):
        dp[0][j] = j                      # insert all
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j],      # delete
                                   dp[i][j - 1],      # insert
                                   dp[i - 1][j - 1])  # replace
    return dp[m][n]

print(lcs("abcde", "ace"), edit_distance("horse", "ros"))   # 3 3
```

Related: longest palindromic subsequence = `lcs(s, s[::-1])`; minimum insertions to make a palindrome = `len(s) − LPS`; shortest common supersequence length = `m + n − LCS`.

### 6. Stocks (state machine DP)

```python
def max_profit_with_cooldown(prices):
    hold, sold, rest = float("-inf"), 0, 0
    for p in prices:
        hold, sold, rest = max(hold, rest - p), hold + p, max(rest, sold)
    return max(sold, rest)

def max_profit_k(prices, k):                    # at most k transactions
    buy = [float("-inf")] * (k + 1)
    sell = [0] * (k + 1)
    for p in prices:
        for t in range(1, k + 1):
            buy[t] = max(buy[t], sell[t - 1] - p)
            sell[t] = max(sell[t], buy[t] + p)
    return sell[k]

print(max_profit_with_cooldown([1, 2, 3, 0, 2]), max_profit_k([3, 2, 6, 5, 0, 3], 2))   # 3 7
```

### 7. Interval / partition DP — matrix chain multiplication, burst balloons

```python
from functools import cache

def matrix_chain(dims):                  # matrix i has shape dims[i-1] x dims[i]
    @cache
    def f(i, j):                         # min cost to multiply matrices i..j
        if i == j:
            return 0
        return min(f(i, k) + f(k + 1, j) + dims[i - 1] * dims[k] * dims[j] for k in range(i, j))
    return f(1, len(dims) - 1)

def max_coins(nums):                     # burst balloons
    a = [1] + nums + [1]
    @cache
    def f(i, j):                         # best for open interval (i, j)
        return max((f(i, k) + a[i] * a[k] * a[j] + f(k, j) for k in range(i + 1, j)), default=0)
    return f(0, len(a) - 1)

print(matrix_chain([10, 20, 30, 40, 30]), max_coins([3, 1, 5, 8]))   # 30000 167
```

### 8. Word break (DP over prefixes)

```python
def word_break(s, words):
    words = set(words)
    dp = [True] + [False] * len(s)       # dp[i]: s[:i] can be segmented
    for i in range(1, len(s) + 1):
        dp[i] = any(dp[j] and s[j:i] in words for j in range(i))
    return dp[-1]

print(word_break("leetcode", ["leet", "code"]), word_break("catsandog", ["cats", "dog", "sand", "and", "cat"]))   # True False
```

### 9. Bitmask DP (small n)

```python
def shortest_hamiltonian_path(dist):     # visit all nodes, any start
    n = len(dist)
    INF = float("inf")
    dp = [[INF] * n for _ in range(1 << n)]
    for i in range(n):
        dp[1 << i][i] = 0
    for mask in range(1 << n):
        for last in range(n):
            if dp[mask][last] == INF:
                continue
            for nxt in range(n):
                if not mask & (1 << nxt):
                    nm = mask | (1 << nxt)
                    dp[nm][nxt] = min(dp[nm][nxt], dp[mask][last] + dist[last][nxt])
    return min(dp[(1 << n) - 1])

print(shortest_hamiltonian_path([[0, 1, 4], [1, 0, 2], [4, 2, 0]]))   # 3
```

## Space optimisation

If row `i` only depends on row `i − 1`, keep two rows (or one, iterating in the right direction). Grid DP, LCS and knapsack all drop from O(n·m) to O(m) space.

## Complexity

**Time = number of states × work per state.** Space = number of states (often reducible).

| Problem | States | Time | Space (optimised) |
|---|---|---|---|
| Climbing stairs / house robber | n | O(n) | O(1) |
| Grid paths | R·C | O(R·C) | O(C) |
| 0/1 knapsack | n·W | O(n·W) | O(W) |
| Coin change | n·amount | O(n·amount) | O(amount) |
| LIS | n | O(n²) / O(n log n) | O(n) |
| LCS / edit distance | m·n | O(m·n) | O(min(m, n)) |
| Matrix chain / burst balloons | n² | O(n³) | O(n²) |
| Bitmask DP | 2ⁿ·n | O(2ⁿ·n²) | O(2ⁿ·n) |

## Common interview variations

- 1D: climbing stairs, frog jump (k steps), house robber I/II, ninja's training
- Grids: unique paths I/II, minimum path sum, triangle, falling path sum, cherry pickup
- Subsequences: subset sum, partition equal subset, count subsets with sum K, target sum, coin change I/II, rod cutting
- Strings: LCS, longest common substring, LPS, edit distance, wildcard matching, distinct subsequences
- Stocks I–VI, LIS family (print LIS, largest divisible subset, longest string chain, number of LIS)
- Partition DP: MCM, burst balloons, palindrome partitioning II, evaluate boolean expression

> [!WARNING]
> Typical mistakes:
> - Wrong iteration direction in knapsack (forwards = unlimited reuse, backwards = 0/1).
> - Loop order in coin-change counting (coins outer → combinations; amount outer → permutations).
> - Off-by-one with 1-indexed DP tables over strings (`a[i − 1]`).
> - Memoizing on unhashable state (lists) — convert to tuples or indices.
> - Forgetting `@cache` state includes **all** changing parameters.

> [!REMEMBER]
> State → choices → recurrence → base case → order. Start with recursion + `@cache`, then tabulate and compress space. Time = states × transitions.
