Shortest-path algorithms find minimum-cost routes in a graph. The right choice depends on edge weights: unweighted → BFS, 0/1 → 0-1 BFS, non-negative → Dijkstra, negative → Bellman-Ford, all pairs → Floyd-Warshall.

## Concept

| Algorithm | Weights | Source | Time | Detects negative cycles |
|---|---|---|---|---|
| BFS | all equal (unweighted) | single | O(V + E) | — |
| 0-1 BFS | 0 or 1 | single | O(V + E) | — |
| Dijkstra (binary heap) | ≥ 0 | single | O((V + E) log V) | ❌ |
| Bellman-Ford | any | single | O(V · E) | ✅ |
| DAG relaxation (topo order) | any, DAG only | single | O(V + E) | n/a |
| Floyd-Warshall | any | all pairs | O(V³) | ✅ (negative diagonal) |

## Core intuition: relaxation

All of them repeatedly **relax** edges: if going through `u` gives a cheaper way to reach `v`, update it.

```python
if dist[u] + w < dist[v]:
    dist[v] = dist[u] + w
```

They differ only in **the order** in which edges are relaxed.

## Important patterns

### 1. Unweighted: BFS

```python
from collections import deque

def shortest_unweighted(adj, src, n):
    dist = [-1] * n
    dist[src] = 0
    q = deque([src])
    while q:
        u = q.popleft()
        for v in adj[u]:
            if dist[v] == -1:
                dist[v] = dist[u] + 1
                q.append(v)
    return dist

print(shortest_unweighted([[1, 3], [0, 2], [1, 3], [0, 2, 4], [3]], 0, 5))   # [0, 1, 2, 1, 2]
```

### 2. Dijkstra (non-negative weights)

```python
import heapq

def dijkstra(n, edges, src):
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
        adj[v].append((u, w))                 # remove for directed graphs
    dist = [float("inf")] * n
    dist[src] = 0
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue                          # stale entry — skip
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v] = d + w
                heapq.heappush(pq, (dist[v], v))
    return dist

edges = [(0, 1, 4), (0, 2, 1), (2, 1, 2), (1, 3, 1), (2, 3, 5)]
print(dijkstra(4, edges, 0))   # [0, 3, 1, 4]
```

Why it fails with negative edges: once a node is popped with the smallest distance, Dijkstra assumes nothing can improve it. A later negative edge could.

#### Path reconstruction

```python
import heapq

def dijkstra_path(adj, src, dst):
    dist, parent = {src: 0}, {src: None}
    pq = [(0, src)]
    while pq:
        d, u = heapq.heappop(pq)
        if u == dst:
            break
        if d > dist[u]:
            continue
        for v, w in adj.get(u, []):
            if d + w < dist.get(v, float("inf")):
                dist[v], parent[v] = d + w, u
                heapq.heappush(pq, (d + w, v))
    path, node = [], dst
    while node is not None:
        path.append(node)
        node = parent.get(node)
    return dist.get(dst), path[::-1]

adj = {"A": [("B", 1), ("C", 4)], "B": [("C", 2), ("D", 5)], "C": [("D", 1)]}
print(dijkstra_path(adj, "A", "D"))   # (4, ['A', 'B', 'C', 'D'])
```

### 3. Grid shortest path with weights — minimum effort path

```python
import heapq

def minimum_effort_path(heights):
    R, C = len(heights), len(heights[0])
    effort = [[float("inf")] * C for _ in range(R)]
    effort[0][0] = 0
    pq = [(0, 0, 0)]
    while pq:
        e, r, c = heapq.heappop(pq)
        if (r, c) == (R - 1, C - 1):
            return e
        if e > effort[r][c]:
            continue
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < R and 0 <= nc < C:
                ne = max(e, abs(heights[nr][nc] - heights[r][c]))   # path cost = max step
                if ne < effort[nr][nc]:
                    effort[nr][nc] = ne
                    heapq.heappush(pq, (ne, nr, nc))

print(minimum_effort_path([[1, 2, 2], [3, 8, 2], [5, 3, 5]]))   # 2
```

### 4. 0-1 BFS (weights 0 or 1, deque)

```python
from collections import deque

def zero_one_bfs(n, adj, src):            # adj[u] = [(v, w)] with w in {0, 1}
    dist = [float("inf")] * n
    dist[src] = 0
    dq = deque([src])
    while dq:
        u = dq.popleft()
        for v, w in adj[u]:
            if dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                if w == 0:
                    dq.appendleft(v)       # free edge → front
                else:
                    dq.append(v)
    return dist

print(zero_one_bfs(3, [[(1, 1), (2, 0)], [], [(1, 0)]], 0))   # [0, 0, 0]
```

### 5. Bellman-Ford (negative weights, cycle detection)

```python
def bellman_ford(n, edges, src):
    dist = [float("inf")] * n
    dist[src] = 0
    for _ in range(n - 1):                    # a shortest path has at most V-1 edges
        changed = False
        for u, v, w in edges:
            if dist[u] != float("inf") and dist[u] + w < dist[v]:
                dist[v] = dist[u] + w
                changed = True
        if not changed:
            break
    for u, v, w in edges:                     # one more round: still improving → negative cycle
        if dist[u] != float("inf") and dist[u] + w < dist[v]:
            return None
    return dist

print(bellman_ford(4, [(0, 1, 4), (0, 2, 5), (1, 2, -3), (2, 3, 2)], 0))   # [0, 4, 1, 3]
print(bellman_ford(3, [(0, 1, 1), (1, 2, -2), (2, 1, 1)], 0))              # None
```

### 6. Cheapest flights within K stops (bounded Bellman-Ford)

```python
def find_cheapest_price(n, flights, src, dst, k):
    dist = [float("inf")] * n
    dist[src] = 0
    for _ in range(k + 1):                    # at most k + 1 edges
        nxt = dist[:]                         # copy → use only last round's values
        for u, v, w in flights:
            if dist[u] + w < nxt[v]:
                nxt[v] = dist[u] + w
        dist = nxt
    return -1 if dist[dst] == float("inf") else dist[dst]

print(find_cheapest_price(4, [[0, 1, 100], [1, 2, 100], [2, 0, 100], [1, 3, 600], [2, 3, 200]], 0, 3, 1))   # 700
```

### 7. Floyd-Warshall (all pairs)

```python
def floyd_warshall(n, edges):
    INF = float("inf")
    d = [[0 if i == j else INF for j in range(n)] for i in range(n)]
    for u, v, w in edges:
        d[u][v] = min(d[u][v], w)
    for k in range(n):                        # allow k as an intermediate vertex
        for i in range(n):
            dik = d[i][k]
            if dik == INF:
                continue
            for j in range(n):
                if dik + d[k][j] < d[i][j]:
                    d[i][j] = dik + d[k][j]
    has_negative_cycle = any(d[i][i] < 0 for i in range(n))
    return d, has_negative_cycle

dist, neg = floyd_warshall(3, [(0, 1, 3), (1, 2, 1), (0, 2, 7)])
print(dist[0][2], neg)   # 4 False
```

### 8. Counting shortest paths

```python
import heapq

def count_paths(n, roads, mod=10**9 + 7):
    adj = [[] for _ in range(n)]
    for u, v, w in roads:
        adj[u].append((v, w)); adj[v].append((u, w))
    dist, ways = [float("inf")] * n, [0] * n
    dist[0], ways[0] = 0, 1
    pq = [(0, 0)]
    while pq:
        d, u = heapq.heappop(pq)
        if d > dist[u]:
            continue
        for v, w in adj[u]:
            if d + w < dist[v]:
                dist[v], ways[v] = d + w, ways[u]
                heapq.heappush(pq, (dist[v], v))
            elif d + w == dist[v]:
                ways[v] = (ways[v] + ways[u]) % mod
    return ways[n - 1]

print(count_paths(4, [(0, 1, 1), (0, 2, 1), (1, 3, 1), (2, 3, 1)]))   # 2
```

## Complexity

See the table at the top. With an adjacency list and binary heap, Dijkstra is O((V + E) log V).

## Common interview variations

- Shortest path in a binary maze, path with minimum effort, swim in rising water
- Network delay time, cheapest flights within K stops, number of ways to arrive
- Minimum multiplications to reach end (BFS over numbers mod 100000)
- Find the city with the smallest number of neighbours (Floyd-Warshall)
- Negative cycle detection (Bellman-Ford)

> [!WARNING]
> Typical mistakes:
> - Using Dijkstra with negative edges.
> - Not skipping stale heap entries (`if d > dist[u]: continue`) → slower, sometimes wrong counts.
> - In K-stops problems, relaxing with the current round's values (copy `dist` each round).
> - Floyd-Warshall with `k` as the inner loop — `k` must be outermost.

> [!REMEMBER]
> Relaxation is the core. BFS for unit weights, deque for 0/1, heap for non-negative, V−1 rounds for negative (plus one more to detect cycles), triple loop with k outermost for all pairs.
