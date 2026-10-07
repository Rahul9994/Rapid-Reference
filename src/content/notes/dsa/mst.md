A **Minimum Spanning Tree** connects all vertices of a connected, undirected, weighted graph with the minimum total edge weight and no cycles. Classic uses: laying cable or roads at minimum cost, clustering, approximation algorithms.

## Concept

- A spanning tree of V vertices has exactly **V − 1 edges**.
- An MST may not be unique, but its **total weight is** unique when weights are distinct.
- If the graph is disconnected, you get a **minimum spanning forest** instead.

```diagram The example graph used below and its MST (total weight 16)
 Graph (edge weights on the lines)        MST — drop 3─4 (5) and 4─5 (7)
  0 ──1── 1 ──4── 2                        0 ──1── 1 ──4── 2
  │       │       │                        │       │       │
  3       2       6                        3       2       6
  │       │       │                        │       │       │
  3 ──5── 4 ──7── 5                        3       4       5
```

## Core intuition: the cut property

For any split of the vertices into two groups, the **lightest edge crossing the split** belongs to some MST. Both classic algorithms are greedy applications of this fact:

- **Kruskal**: consider edges globally from lightest to heaviest; take an edge if it doesn't form a cycle (checked with DSU).
- **Prim**: grow one tree from a start vertex; always add the lightest edge leaving the tree (min-heap).

## Important patterns

### 1. Kruskal's algorithm (sort + DSU)

```python
class DSU:
    def __init__(self, n):
        self.parent = list(range(n))
        self.size = [1] * n

    def find(self, x):
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]   # path halving
            x = self.parent[x]
        return x

    def union(self, a, b):
        ra, rb = self.find(a), self.find(b)
        if ra == rb:
            return False
        if self.size[ra] < self.size[rb]:
            ra, rb = rb, ra
        self.parent[rb] = ra
        self.size[ra] += self.size[rb]
        return True

def kruskal(n, edges):
    dsu = DSU(n)
    total, chosen = 0, []
    for u, v, w in sorted(edges, key=lambda e: e[2]):
        if dsu.union(u, v):               # different components → no cycle
            total += w
            chosen.append((u, v, w))
            if len(chosen) == n - 1:
                break
    return total, chosen

edges = [(0, 1, 1), (1, 2, 4), (0, 3, 3), (1, 4, 2), (3, 4, 5), (2, 5, 6), (4, 5, 7)]
print(kruskal(6, edges))
```

```output
(16, [(0, 1, 1), (1, 4, 2), (0, 3, 3), (1, 2, 4), (2, 5, 6)])
```

### 2. Prim's algorithm (min-heap)

```python
import heapq

def prim(n, edges, start=0):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((w, v))
        adj[v].append((w, u))
    in_tree = [False] * n
    pq = [(0, start)]
    total = taken = 0
    while pq and taken < n:
        w, u = heapq.heappop(pq)
        if in_tree[u]:
            continue                      # stale: u was already added more cheaply
        in_tree[u] = True
        total += w
        taken += 1
        for nw, v in adj[u]:
            if not in_tree[v]:
                heapq.heappush(pq, (nw, v))
    return total if taken == n else None  # None → graph is disconnected

print(prim(6, edges))   # 16
```

### 3. Minimum cost to connect all points (dense graph Prim, O(V²))

When every pair of points is an edge (E = V²), an array-based Prim without a heap is simplest and fastest:

```python
def min_cost_connect_points(points):
    n = len(points)
    in_tree = [False] * n
    best = [float("inf")] * n            # cheapest edge from the tree to each point
    best[0] = 0
    total = 0
    for _ in range(n):
        u = min((i for i in range(n) if not in_tree[i]), key=best.__getitem__)
        in_tree[u] = True
        total += best[u]
        x1, y1 = points[u]
        for v in range(n):
            if not in_tree[v]:
                d = abs(x1 - points[v][0]) + abs(y1 - points[v][1])   # Manhattan distance
                if d < best[v]:
                    best[v] = d
    return total

print(min_cost_connect_points([[0, 0], [2, 2], [3, 10], [5, 2], [7, 0]]))   # 20
```

## Kruskal vs Prim

| | Kruskal | Prim |
|---|---|---|
| Strategy | global: cheapest edges first | local: grow one tree |
| Data structure | sort + DSU | min-heap (or array) |
| Time | O(E log E) | O(E log V) with heap, O(V²) with array |
| Best for | sparse graphs, edge lists | dense graphs, adjacency lists |
| Disconnected graph | produces a spanning forest naturally | must restart from each component |

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Kruskal | O(E log E) (sorting dominates) | O(V) for DSU |
| Prim (binary heap) | O(E log V) | O(V + E) |
| Prim (array, dense) | O(V²) | O(V) |

## Common interview variations

- Minimum cost to connect all points / cities, connecting cities with minimum cost
- Find critical and pseudo-critical edges in an MST (Kruskal with forced/excluded edges)
- Optimise water distribution (add a virtual node connected to every house)
- Number of operations to make the network connected (DSU component counting)
- Second-best MST (advanced)

> [!WARNING]
> Typical mistakes:
> - Using MST to answer shortest-path questions — an MST minimises total weight, not distance between two specific nodes.
> - Applying Prim/Kruskal to directed graphs (that's the harder "minimum arborescence" problem).
> - Not checking that the result has V − 1 edges (disconnected graph).

> [!REMEMBER]
> Cut property → greedy works. Kruskal: sort edges, union if components differ. Prim: heap of edges leaving the tree, skip stale entries. V − 1 edges or the graph is disconnected.
