Disjoint Set Union (DSU), also called **Union-Find**, maintains a collection of non-overlapping sets and supports two operations almost in O(1): **find** which set an element belongs to, and **union** two sets.

## Concept

Each set is a tree; the root is the set's **representative**. `parent[x]` points toward the root.

```diagram Union by size + path compression
 Before find(4):        After find(4) with path compression:
       0                        0
       │                     ╱ │ ╲
       1                    1  2  4
       │                    (every node on the path now points to the root)
       2
       │
       4
```

Two optimisations make it fast:

1. **Union by rank/size** — attach the smaller tree under the larger root (keeps trees shallow).
2. **Path compression** — during `find`, point visited nodes directly at the root.

With both, each operation costs **O(α(n))** amortized — α is the inverse Ackermann function, ≤ 4 for any practical n.

## Core intuition

DSU answers "are these two connected?" while edges are being **added** over time — something BFS/DFS would have to recompute from scratch. It can't efficiently handle edge deletions (process those offline in reverse if possible).

## Important patterns

### 1. Implementation

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n
        self.components = n

    def find(self, x):
        root = x
        while self.parent[root] != root:
            root = self.parent[root]
        while self.parent[x] != root:          # full path compression (iterative)
            self.parent[x], x = root, self.parent[x]
        return root

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False                       # already connected
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra                   # union by size
        self.size[ra] += self.size[rb]
        self.components -= 1
        return True

    def connected(self, a, b):
        return self.find(a) == self.find(b)

d = DSU(5)
d.union(0, 1); d.union(3, 4); d.union(1, 4)
print(d.connected(0, 3), d.connected(0, 2), d.components, d.size[d.find(0)])   # True False 2 4
```

### 2. Number of provinces / connected components

```python
def find_circle_num(is_connected):
    n = len(is_connected)
    dsu = DSU(n)
    for i in range(n):
        for j in range(i + 1, n):
            if is_connected[i][j]:
                dsu.union(i, j)
    return dsu.components

print(find_circle_num([[1, 1, 0], [1, 1, 0], [0, 0, 1]]))   # 2
```

### 3. Redundant connection (first edge that creates a cycle)

```python
def find_redundant_connection(edges):
    dsu = DSU(len(edges) + 1)
    for u, v in edges:
        if not dsu.union(u, v):
            return [u, v]

print(find_redundant_connection([[1, 2], [1, 3], [2, 3]]))   # [2, 3]
```

### 4. Operations to make a network connected

```python
def make_connected(n, connections):
    if len(connections) < n - 1:
        return -1                      # not enough cables
    dsu = DSU(n)
    for u, v in connections:
        dsu.union(u, v)
    return dsu.components - 1          # each extra cable joins two components

print(make_connected(6, [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3]]))   # 2
```

### 5. Accounts merge (DSU over items via a hash map)

```python
from collections import defaultdict

def accounts_merge(accounts):
    dsu = DSU(len(accounts))
    owner = {}                                   # email → first account index
    for i, (_, *emails) in enumerate(accounts):
        for e in emails:
            if e in owner:
                dsu.union(i, owner[e])
            else:
                owner[e] = i
    groups = defaultdict(set)
    for e, i in owner.items():
        groups[dsu.find(i)].add(e)
    return [[accounts[r][0]] + sorted(es) for r, es in groups.items()]

acc = [["John", "a@x", "b@x"], ["John", "c@x"], ["John", "b@x", "d@x"], ["Mary", "m@x"]]
print(accounts_merge(acc))
```

```output
[['John', 'a@x', 'b@x', 'd@x'], ['John', 'c@x'], ['Mary', 'm@x']]
```

### 6. Number of islands II (online additions on a grid)

```python
def num_islands_2(rows, cols, positions):
    dsu = DSU(rows * cols)
    land, res, count = set(), [], 0
    for r, c in positions:
        idx = r * cols + c                 # flatten 2D → 1D id
        if idx not in land:
            land.add(idx)
            count += 1
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                nidx = nr * cols + nc
                if 0 <= nr < rows and 0 <= nc < cols and nidx in land and dsu.union(idx, nidx):
                    count -= 1
        res.append(count)
    return res

print(num_islands_2(3, 3, [(0, 0), (0, 1), (1, 2), (2, 1), (1, 1)]))   # [1, 1, 2, 3, 1]
```

### 7. Most stones removed (union rows with columns)

```python
def remove_stones(stones):
    max_row = max(r for r, _ in stones) + 1
    max_col = max(c for _, c in stones) + 1
    dsu = DSU(max_row + max_col)
    used = set()
    for r, c in stones:
        dsu.union(r, max_row + c)          # column nodes are offset after rows
        used.update((r, max_row + c))
    roots = {dsu.find(x) for x in used}
    return len(stones) - len(roots)        # each component keeps one stone

print(remove_stones([[0, 0], [0, 1], [1, 0], [1, 2], [2, 1], [2, 2]]))   # 5
```

## Complexity

| Operation | Naive | Union by size + path compression |
|---|---|---|
| find | O(n) | O(α(n)) amortized |
| union | O(n) | O(α(n)) amortized |
| space | O(n) | O(n) |

## Common interview variations

- Number of provinces, connected components, graph valid tree
- Redundant connection, operations to make a network connected
- Kruskal's MST, accounts merge, similar string groups
- Number of islands II, making a large island, most stones removed
- Satisfiability of equality equations (`a==b`, `a!=b`)

> [!WARNING]
> Typical mistakes:
> - Comparing `parent[a] == parent[b]` instead of `find(a) == find(b)`.
> - Forgetting to union **roots** (attach `rb` under `ra`, not `b` under `a`).
> - Recursive `find` hitting Python's recursion limit before compression kicks in — use the iterative version.
> - Trying to "un-union" (DSU doesn't support deletions).

> [!REMEMBER]
> `find` with path compression + `union` by size = near-O(1). Use DSU for incremental connectivity, cycle detection in undirected graphs, Kruskal, and grouping items that share keys (map items → indices).
