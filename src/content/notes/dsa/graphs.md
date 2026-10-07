A graph is a set of **vertices** connected by **edges**. Maps, social networks, dependencies, grids and state machines are all graphs — recognising that is half the battle.

## Concept

| Term | Meaning |
|---|---|
| Directed / undirected | edges have a direction (`u → v`) or not |
| Weighted / unweighted | edges carry a cost or not |
| Degree | number of edges at a vertex (in-degree / out-degree for directed) |
| Path / cycle | sequence of edges / path that returns to its start |
| Connected component | maximal set of mutually reachable vertices (undirected) |
| DAG | directed acyclic graph — has a topological order |
| Tree | connected, acyclic, exactly V − 1 edges |
| Bipartite | vertices split into two sets with edges only across |
| Dense / sparse | E close to V² / E close to V |

```diagram Undirected graph and its adjacency list
   0 ─── 1               0: [1, 2]
   │   ╱ │               1: [0, 2, 3]
   │  ╱  │               2: [0, 1]
   2     3 ─── 4         3: [1, 4]
                         4: [3]
```

## Representations

```python
from collections import defaultdict

edges = [(0, 1), (0, 2), (1, 2), (1, 3), (3, 4)]
n = 5

# 1. Adjacency list — O(V + E) space, the default choice
adj = defaultdict(list)
for u, v in edges:
    adj[u].append(v)
    adj[v].append(u)          # omit for directed graphs

# 2. Adjacency matrix — O(V²) space, O(1) edge lookup
matrix = [[0] * n for _ in range(n)]
for u, v in edges:
    matrix[u][v] = matrix[v][u] = 1

# 3. Edge list — useful for Kruskal / Bellman-Ford
weighted = [(0, 1, 4), (1, 2, 1), (0, 2, 7)]      # (u, v, w)
wadj = defaultdict(list)
for u, v, w in weighted:
    wadj[u].append((v, w))

print(dict(adj), matrix[1][3], wadj[0])
```

| | Adjacency list | Adjacency matrix |
|---|---|---|
| Space | O(V + E) | O(V²) |
| Check edge (u, v) | O(deg u) | O(1) |
| Iterate neighbours | O(deg u) | O(V) |
| Best for | sparse graphs (most problems) | dense graphs, Floyd-Warshall |

## Core intuition

Model the problem first: **what are the nodes? what are the edges? weighted? directed?** Then pick the algorithm by the question:

| Question | Algorithm |
|---|---|
| Reachability, components, flood fill | BFS / DFS |
| Shortest path, unweighted | BFS |
| Shortest path, 0/1 weights | 0-1 BFS (deque) |
| Shortest path, non-negative weights | Dijkstra |
| Shortest path, negative weights | Bellman-Ford |
| All-pairs shortest path (small V) | Floyd-Warshall |
| Ordering with dependencies | Topological sort |
| Cycle detection | DFS colours (directed), DSU / parent tracking (undirected) |
| Connect everything at minimum cost | MST (Kruskal / Prim) |
| Dynamic connectivity / grouping | Disjoint Set Union |
| Two-colouring | BFS/DFS bipartite check |

## Grids are graphs

Each cell is a node; neighbours are the 4 (or 8) adjacent cells.

```python
def neighbors(r, c, R, C):
    for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        nr, nc = r + dr, c + dc
        if 0 <= nr < R and 0 <= nc < C:
            yield nr, nc

print(list(neighbors(0, 0, 3, 3)))   # [(1, 0), (0, 1)]
```

## Implicit graphs

Sometimes nodes are **states**: words in word ladder (edges = one-letter changes), lock combinations (edges = one wheel turn), board positions. You generate neighbours on the fly instead of building the graph.

```python
def lock_neighbors(code):
    for i in range(4):
        d = int(code[i])
        for step in (-1, 1):
            yield code[:i] + str((d + step) % 10) + code[i + 1:]

print(list(lock_neighbors("0000"))[:4])   # ['9000', '1000', '0900', '0100']
```

## Degree facts worth knowing

- Sum of degrees in an undirected graph = 2E (handshake lemma).
- A tree with V vertices has V − 1 edges.
- Number of edges in a complete graph: V(V − 1)/2.

## Complexity

| Operation | List | Matrix |
|---|---|---|
| Build | O(V + E) | O(V²) |
| BFS / DFS | O(V + E) | O(V²) |
| Space | O(V + E) | O(V²) |

## Common interview variations

- Number of provinces / connected components, number of islands
- Clone a graph, course schedule (cycle + topo), is graph bipartite
- Word ladder, open the lock, snakes and ladders (implicit BFS)
- Network delay time, cheapest flights within K stops (shortest paths)
- Accounts merge, redundant connection (DSU)

> [!WARNING]
> Typical mistakes:
> - Forgetting to add both directions for undirected edges.
> - Assuming the graph is connected — loop over all vertices to start traversals.
> - Using an adjacency matrix for 10⁵ vertices (10¹⁰ cells).
> - Revisiting nodes without a `visited` set → infinite loops.

> [!REMEMBER]
> Define nodes and edges first. Adjacency list by default. BFS for unweighted shortest paths, Dijkstra for weighted, topological sort for dependencies, DSU for connectivity, MST for cheapest connection.
