Breadth-first search (BFS) and depth-first search (DFS) are the two fundamental ways to explore a graph. Almost every graph algorithm is one of them with extra bookkeeping.

## Concept

| | BFS | DFS |
|---|---|---|
| Data structure | queue (`deque`) | stack / recursion |
| Order | level by level (nearest first) | go deep, then backtrack |
| Shortest path (unweighted) | ✅ yes | ❌ no |
| Memory | O(width) | O(depth) |
| Typical uses | shortest steps, multi-source spread, levels | components, cycles, topological order, paths, backtracking |

```diagram Visit order from node 1
 graph:        1             BFS: 1, 2, 3, 4, 5, 6
             /   \           DFS: 1, 2, 4, 5, 3, 6
            2     3
           / \     \
          4   5     6
```

## Core intuition

BFS expands a "wavefront" one edge at a time, so the first time it reaches a node is via the fewest edges. DFS follows one path to its end, which naturally exposes structure like cycles, finish order and connected regions.

## Important patterns

### 1. BFS template (with distances)

```python
from collections import deque

def bfs(adj, src):
    dist = {src: 0}
    q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if v not in dist:          # mark when ENQUEUING
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

adj = {1: [2, 3], 2: [1, 4, 5], 3: [1, 6], 4: [2], 5: [2], 6: [3]}
print(bfs(adj, 1))   # {1: 0, 2: 1, 3: 1, 4: 2, 5: 2, 6: 2}
```

### 2. DFS template (recursive and iterative)

```python
def dfs_recursive(adj, src):
    order, seen = [], set()
    def go(u):
        seen.add(u)
        order.append(u)
        for v in adj[u]:
            if v not in seen:
                go(v)
    go(src)
    return order

def dfs_iterative(adj, src):
    order, seen, stack = [], set(), [src]
    while stack:
        u = stack.pop()
        if u in seen:
            continue
        seen.add(u)
        order.append(u)
        for v in reversed(adj[u]):      # reversed → same order as recursion
            if v not in seen:
                stack.append(v)
    return order

print(dfs_recursive(adj, 1), dfs_iterative(adj, 1))   # [1, 2, 4, 5, 3, 6] [1, 2, 4, 5, 3, 6]
```

### 3. Connected components / number of provinces

```python
def count_components(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    seen, comps = [False] * n, 0
    for s in range(n):
        if seen[s]:
            continue
        comps += 1
        stack = [s]
        seen[s] = True
        while stack:
            u = stack.pop()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append(v)
    return comps

print(count_components(5, [(0, 1), (1, 2), (3, 4)]))   # 2
```

### 4. Number of islands (grid DFS / flood fill)

```python
def num_islands(grid):
    R, C = len(grid), len(grid[0])
    def sink(r, c):
        stack = [(r, c)]
        grid[r][c] = "0"
        while stack:
            r, c = stack.pop()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < R and 0 <= nc < C and grid[nr][nc] == "1":
                    grid[nr][nc] = "0"
                    stack.append((nr, nc))
    count = 0
    for r in range(R):
        for c in range(C):
            if grid[r][c] == "1":
                count += 1
                sink(r, c)
    return count

grid = [list("11000"), list("11000"), list("00100"), list("00011")]
print(num_islands(grid))   # 3
```

Variants: flood fill (recolour), surrounded regions (start DFS from the border), number of enclaves, distinct islands (record the shape as relative coordinates).

### 5. Multi-source BFS — distance to nearest 0

```python
from collections import deque

def update_matrix(mat):
    R, C = len(mat), len(mat[0])
    dist = [[-1] * C for _ in range(R)]
    q = deque()
    for r in range(R):
        for c in range(C):
            if mat[r][c] == 0:
                dist[r][c] = 0
                q.append((r, c))            # all sources start together
    while q:
        r, c = q.popleft()
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C and dist[nr][nc] == -1:
                dist[nr][nc] = dist[r][c] + 1
                q.append((nr, nc))
    return dist

print(update_matrix([[0, 0, 0], [0, 1, 0], [1, 1, 1]]))   # [[0, 0, 0], [0, 1, 0], [1, 2, 1]]
```

### 6. Cycle detection — undirected (track the parent)

```python
def has_cycle_undirected(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v); adj[v].append(u)
    seen = [False] * n
    for s in range(n):
        if seen[s]:
            continue
        stack = [(s, -1)]
        seen[s] = True
        while stack:
            u, parent = stack.pop()
            for v in adj[u]:
                if not seen[v]:
                    seen[v] = True
                    stack.append((v, u))
                elif v != parent:
                    return True              # visited and not the edge we came from
    return False

print(has_cycle_undirected(4, [(0, 1), (1, 2), (2, 0), (2, 3)]), has_cycle_undirected(3, [(0, 1), (1, 2)]))   # True False
```

### 7. Cycle detection — directed (three colours)

```python
def has_cycle_directed(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    WHITE, GRAY, BLACK = 0, 1, 2           # unvisited / on the current path / finished
    color = [WHITE] * n
    def dfs(u):
        color[u] = GRAY
        for v in adj[u]:
            if color[v] == GRAY:
                return True                # back edge → cycle
            if color[v] == WHITE and dfs(v):
                return True
        color[u] = BLACK
        return False
    return any(color[u] == WHITE and dfs(u) for u in range(n))

print(has_cycle_directed(3, [(0, 1), (1, 2), (2, 0)]), has_cycle_directed(3, [(0, 1), (0, 2), (1, 2)]))   # True False
```

> [!IMPORTANT]
> In directed graphs, "already visited" is not enough to declare a cycle — only an edge back to a node **on the current DFS path** (gray) is a cycle.

### 8. Bipartite check (two-colouring)

```python
from collections import deque

def is_bipartite(adj):
    color = {}
    for s in adj:
        if s in color:
            continue
        color[s] = 0
        q = deque([s])
        while q:
            u = q.popleft()
            for v in adj[u]:
                if v not in color:
                    color[v] = 1 - color[u]
                    q.append(v)
                elif color[v] == color[u]:
                    return False         # same colour on both ends of an edge
    return True

print(is_bipartite({0: [1, 3], 1: [0, 2], 2: [1, 3], 3: [0, 2]}), is_bipartite({0: [1, 2], 1: [0, 2], 2: [0, 1]}))   # True False
```

A graph is bipartite **iff** it has no odd-length cycle.

### 9. Word ladder (BFS on an implicit graph)

```python
from collections import deque
import string

def ladder_length(begin, end, words):
    words = set(words)
    if end not in words:
        return 0
    q, seen = deque([(begin, 1)]), {begin}
    while q:
        w, d = q.popleft()
        if w == end:
            return d
        for i in range(len(w)):
            for ch in string.ascii_lowercase:
                nxt = w[:i] + ch + w[i + 1:]
                if nxt in words and nxt not in seen:
                    seen.add(nxt)
                    q.append((nxt, d + 1))
    return 0

print(ladder_length("hit", "cog", ["hot", "dot", "dog", "lot", "log", "cog"]))   # 5
```

### 10. Clone a graph (DFS + hash map)

```python
class Node:
    def __init__(self, val, neighbors=None):
        self.val, self.neighbors = val, neighbors or []

def clone_graph(node):
    copies = {}
    def dfs(u):
        if u in copies:
            return copies[u]
        copy = copies[u] = Node(u.val)
        copy.neighbors = [dfs(v) for v in u.neighbors]
        return copy
    return dfs(node) if node else None
```

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| BFS / DFS (adjacency list) | O(V + E) | O(V) |
| Grid BFS / DFS | O(R·C) | O(R·C) |
| Word ladder | O(N · L · 26) | O(N · L) |

## Common interview variations

- Number of islands/provinces, flood fill, surrounded regions, number of enclaves
- Rotting oranges, 01 matrix, walls and gates (multi-source BFS)
- Cycle detection (directed/undirected), bipartite graph
- Word ladder I/II, clone graph, distinct islands
- Shortest path in a binary maze

> [!WARNING]
> Typical mistakes:
> - Marking visited when dequeuing (BFS) → nodes enqueued many times.
> - Recursive DFS on 10⁵-cell grids → `RecursionError`; prefer an explicit stack.
> - Using the undirected "parent" trick on directed graphs.
> - Forgetting disconnected components.

> [!REMEMBER]
> BFS = queue + mark on enqueue → shortest unweighted paths. DFS = stack/recursion → components, cycles, ordering. Grids: 4-direction neighbours with bounds checks. Directed cycles need gray/black colours.
