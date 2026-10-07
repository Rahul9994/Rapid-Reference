Backtracking explores all candidate solutions by building them step by step and **undoing** each choice after exploring it. Pruning (abandoning partial solutions early) is what makes it practical.

## Concept

```python
def backtrack(state):
    if is_solution(state):
        record(state)
        return
    for choice in choices(state):
        if not valid(state, choice):
            continue            # prune
        make(state, choice)     # choose
        backtrack(state)        # explore
        undo(state, choice)     # un-choose
```

```diagram Decision tree for subsets of [1, 2, 3]
                    []
           /                 \
        [1]                   []
       /    \               /    \
   [1,2]    [1]          [2]      []
   /   \    /  \        /   \    /  \
[1,2,3][1,2][1,3][1] [2,3] [2] [3]  []
```

## Core intuition

You're doing a DFS over a tree of decisions. The leaves are complete candidates. **Pruning** cuts entire subtrees as soon as a partial state can't lead to a valid answer.

## Important patterns

### 1. Subsets (start-index style)

```python
def subsets(nums):
    res, path = [], []
    def go(start):
        res.append(path[:])                  # every node is a subset
        for i in range(start, len(nums)):
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return res

print(subsets([1, 2, 3]))   # [[], [1], [1, 2], [1, 2, 3], [1, 3], [2], [2, 3], [3]]
```

### 2. Subsets II — skip duplicates

```python
def subsets_with_dup(nums):
    nums.sort()
    res, path = [], []
    def go(start):
        res.append(path[:])
        for i in range(start, len(nums)):
            if i > start and nums[i] == nums[i - 1]:
                continue                     # same value at the same depth → duplicate branch
            path.append(nums[i])
            go(i + 1)
            path.pop()
    go(0)
    return res

print(subsets_with_dup([1, 2, 2]))   # [[], [1], [1, 2], [1, 2, 2], [2], [2, 2]]
```

### 3. Combination sum (reuse allowed) and II (each once)

```python
def combination_sum(candidates, target):
    res, path = [], []
    candidates.sort()
    def go(start, remain):
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if candidates[i] > remain:
                break                        # sorted → prune the rest
            path.append(candidates[i])
            go(i, remain - candidates[i])    # i, not i+1: reuse allowed
            path.pop()
    go(0, target)
    return res

def combination_sum2(candidates, target):
    res, path = [], []
    candidates.sort()
    def go(start, remain):
        if remain == 0:
            res.append(path[:])
            return
        for i in range(start, len(candidates)):
            if i > start and candidates[i] == candidates[i - 1]:
                continue
            if candidates[i] > remain:
                break
            path.append(candidates[i])
            go(i + 1, remain - candidates[i])
            path.pop()
    go(0, target)
    return res

print(combination_sum([2, 3, 6, 7], 7), combination_sum2([10, 1, 2, 7, 6, 1, 5], 8))
```

```output
[[2, 2, 3], [7]] [[1, 1, 6], [1, 2, 5], [1, 7], [2, 6]]
```

### 4. Permutations (swap-based, O(1) extra besides output)

```python
def permute(nums):
    res = []
    def go(i):
        if i == len(nums):
            res.append(nums[:])
            return
        for j in range(i, len(nums)):
            nums[i], nums[j] = nums[j], nums[i]   # place nums[j] at position i
            go(i + 1)
            nums[i], nums[j] = nums[j], nums[i]   # undo
    go(0)
    return res

print(len(permute([1, 2, 3, 4])))   # 24
```

### 5. N-Queens

```python
def solve_n_queens(n):
    res, board = [], [["."] * n for _ in range(n)]
    cols, diag, anti = set(), set(), set()
    def go(r):
        if r == n:
            res.append(["".join(row) for row in board])
            return
        for c in range(n):
            if c in cols or (r - c) in diag or (r + c) in anti:
                continue                       # attacked → prune
            cols.add(c); diag.add(r - c); anti.add(r + c)
            board[r][c] = "Q"
            go(r + 1)
            board[r][c] = "."
            cols.remove(c); diag.remove(r - c); anti.remove(r + c)
    go(0)
    return res

print(len(solve_n_queens(8)))   # 92
print(solve_n_queens(4)[0])     # ['.Q..', '...Q', 'Q...', '..Q.']
```

Cells on the same diagonal share `r − c`; on the same anti-diagonal they share `r + c`.

### 6. Sudoku solver

```python
def solve_sudoku(board):
    rows = [set() for _ in range(9)]
    cols = [set() for _ in range(9)]
    boxes = [set() for _ in range(9)]
    empty = []
    for r in range(9):
        for c in range(9):
            v = board[r][c]
            if v == ".":
                empty.append((r, c))
            else:
                rows[r].add(v); cols[c].add(v); boxes[r // 3 * 3 + c // 3].add(v)

    def go(k):
        if k == len(empty):
            return True
        r, c = empty[k]
        b = r // 3 * 3 + c // 3
        for v in "123456789":
            if v in rows[r] or v in cols[c] or v in boxes[b]:
                continue
            board[r][c] = v
            rows[r].add(v); cols[c].add(v); boxes[b].add(v)
            if go(k + 1):
                return True                    # stop at the first solution
            board[r][c] = "."
            rows[r].remove(v); cols[c].remove(v); boxes[b].remove(v)
        return False

    go(0)
    return board
```

### 7. Word search in a grid

```python
def exist(board, word):
    R, C = len(board), len(board[0])
    def dfs(r, c, i):
        if i == len(word):
            return True
        if not (0 <= r < R and 0 <= c < C) or board[r][c] != word[i]:
            return False
        ch, board[r][c] = board[r][c], "#"     # mark visited
        found = any(dfs(r + dr, c + dc, i + 1) for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)))
        board[r][c] = ch                         # restore
        return found
    return any(dfs(r, c, 0) for r in range(R) for c in range(C))

grid = [list("ABCE"), list("SFCS"), list("ADEE")]
print(exist(grid, "ABCCED"), exist(grid, "ABCB"))   # True False
```

### 8. Palindrome partitioning

```python
def partition(s):
    res, path = [], []
    def go(start):
        if start == len(s):
            res.append(path[:])
            return
        for end in range(start + 1, len(s) + 1):
            piece = s[start:end]
            if piece == piece[::-1]:
                path.append(piece)
                go(end)
                path.pop()
    go(0)
    return res

print(partition("aab"))   # [['a', 'a', 'b'], ['aa', 'b']]
```

## Complexity

| Problem | Time | Space (recursion + path) |
|---|---|---|
| Subsets | O(n · 2ⁿ) | O(n) |
| Permutations | O(n · n!) | O(n) |
| Combination sum | exponential, bounded by target/min | O(target / min) |
| N-Queens | O(n!) (heavily pruned) | O(n) |
| Sudoku | O(9^empty) worst | O(81) |
| Word search | O(R·C·4^L) | O(L) |

## Common interview variations

- Subsets I/II, permutations I/II, combinations, combination sum I/II/III
- Letter combinations of a phone number, generate parentheses
- N-Queens, Sudoku solver, M-coloring, rat in a maze
- Word search, palindrome partitioning, word break II
- K-th permutation sequence (math, not backtracking)

> [!WARNING]
> Typical mistakes:
> - Not undoing state (missing `pop()`, not restoring the grid cell, not removing from sets).
> - Recording `path` instead of `path[:]`.
> - Duplicates: forgetting to sort before skipping `nums[i] == nums[i − 1]`, or skipping with `i > 0` instead of `i > start`.
> - Recursing with `i + 1` when reuse is allowed (or `i` when it isn't).

> [!REMEMBER]
> Choose → explore → un-choose. Sort + `i > start` skip for duplicates. Prune as early as possible (sorted candidates → `break`). Use sets for O(1) constraint checks (N-Queens, Sudoku).
