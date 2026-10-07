A topological order lists the vertices of a **directed acyclic graph (DAG)** so that every edge `u → v` goes from earlier to later. It answers "in what order can I do these tasks, given their dependencies?"

## Concept

```diagram A DAG of course prerequisites and two valid orders
   0 ──► 1 ──► 3
   │           ▲
   └──► 2 ─────┘
 Valid orders: 0 1 2 3   or   0 2 1 3
```

- Exists **iff** the graph has no directed cycle.
- Usually **not unique**.
- If a topological order of all V vertices can't be produced, the graph contains a cycle.

## Core intuition

A task with **no remaining prerequisites** (in-degree 0) can be done now. Do it, remove its outgoing edges, and repeat. That's Kahn's algorithm. Alternatively, in DFS a node finishes only after all its descendants — so reverse finishing order is a valid topological order.

## Important patterns

### 1. Kahn's algorithm (BFS on in-degrees)

```python
from collections import deque

def topo_kahn(n, edges):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v)
        indeg[v] += 1
    q = deque(i for i in range(n) if indeg[i] == 0)
    order = []
    while q:
        u = q.popleft()
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                q.append(v)
    return order if len(order) == n else []     # [] → cycle detected

print(topo_kahn(4, [(0, 1), (0, 2), (1, 3), (2, 3)]))   # [0, 1, 2, 3]
print(topo_kahn(3, [(0, 1), (1, 2), (2, 0)]))           # [] — cycle
```

### 2. DFS finishing order

```python
def topo_dfs(n, edges):
    adj = [[] for _ in range(n)]
    for u, v in edges:
        adj[u].append(v)
    state = [0] * n                 # 0 = new, 1 = visiting, 2 = done
    order = []
    def dfs(u):
        state[u] = 1
        for v in adj[u]:
            if state[v] == 1:
                raise ValueError("cycle")
            if state[v] == 0:
                dfs(v)
        state[u] = 2
        order.append(u)             # post-order: after all descendants
    for u in range(n):
        if state[u] == 0:
            dfs(u)
    return order[::-1]

print(topo_dfs(4, [(0, 1), (0, 2), (1, 3), (2, 3)]))   # [0, 2, 1, 3]
```

### 3. Course schedule I & II

```python
def can_finish(num_courses, prerequisites):
    # prerequisite pair [a, b] means b must be taken before a → edge b → a
    return len(topo_kahn(num_courses, [(b, a) for a, b in prerequisites])) == num_courses

def find_order(num_courses, prerequisites):
    return topo_kahn(num_courses, [(b, a) for a, b in prerequisites])

print(can_finish(2, [[1, 0]]), can_finish(2, [[1, 0], [0, 1]]), find_order(4, [[1, 0], [2, 0], [3, 1], [3, 2]]))
```

```output
True False [0, 1, 2, 3]
```

### 4. Lexicographically smallest order (heap instead of queue)

```python
import heapq

def topo_smallest(n, edges):
    adj = [[] for _ in range(n)]
    indeg = [0] * n
    for u, v in edges:
        adj[u].append(v); indeg[v] += 1
    heap = [i for i in range(n) if indeg[i] == 0]
    heapq.heapify(heap)
    order = []
    while heap:
        u = heapq.heappop(heap)
        order.append(u)
        for v in adj[u]:
            indeg[v] -= 1
            if indeg[v] == 0:
                heapq.heappush(heap, v)
    return order

print(topo_smallest(4, [(3, 0), (2, 0)]))   # [1, 2, 3, 0]
```

### 5. Alien dictionary (build edges from adjacent words)

```python
from collections import deque

def alien_order(words):
    chars = {c for w in words for c in w}
    adj = {c: set() for c in chars}
    indeg = {c: 0 for c in chars}
    for a, b in zip(words, words[1:]):
        for x, y in zip(a, b):
            if x != y:
                if y not in adj[x]:
                    adj[x].add(y)
                    indeg[y] += 1
                break
        else:
            if len(a) > len(b):
                return ""                       # "abc" before "ab" is invalid
    q = deque(sorted(c for c in chars if indeg[c] == 0))
    out = []
    while q:
        c = q.popleft()
        out.append(c)
        for d in sorted(adj[c]):
            indeg[d] -= 1
            if indeg[d] == 0:
                q.append(d)
    return "".join(out) if len(out) == len(chars) else ""

print(alien_order(["wrt", "wrf", "er", "ett", "rftt"]))   # wertf
```

### 6. Longest path in a DAG / earliest finish times (DP over topo order)

```python
def longest_path_dag(n, edges):            # edges: (u, v, w)
    order = topo_kahn(n, [(u, v) for u, v, _ in edges])
    adj = [[] for _ in range(n)]
    for u, v, w in edges:
        adj[u].append((v, w))
    dist = [0] * n
    for u in order:                         # relax in topological order
        for v, w in adj[u]:
            dist[v] = max(dist[v], dist[u] + w)
    return max(dist)

print(longest_path_dag(4, [(0, 1, 3), (0, 2, 2), (1, 3, 4), (2, 3, 1)]))   # 7
```

Shortest paths in a DAG work the same way (with `min`) and handle **negative weights** in O(V + E).

### 7. Eventual safe states (reverse graph + Kahn)

```python
from collections import deque

def eventual_safe_nodes(graph):
    n = len(graph)
    rev = [[] for _ in range(n)]
    outdeg = [len(graph[u]) for u in range(n)]
    for u in range(n):
        for v in graph[u]:
            rev[v].append(u)
    q = deque(u for u in range(n) if outdeg[u] == 0)   # terminal nodes are safe
    safe = [False] * n
    while q:
        v = q.popleft()
        safe[v] = True
        for u in rev[v]:
            outdeg[u] -= 1
            if outdeg[u] == 0:
                q.append(u)
    return [u for u in range(n) if safe[u]]

print(eventual_safe_nodes([[1, 2], [2, 3], [5], [0], [5], [], []]))   # [2, 4, 5, 6]
```

## Complexity

| Algorithm | Time | Space |
|---|---|---|
| Kahn's / DFS topological sort | O(V + E) | O(V + E) |
| Lexicographically smallest (heap) | O((V + E) log V) | O(V + E) |
| Alien dictionary | O(total characters) | O(unique characters²) |
| DAG shortest/longest path | O(V + E) | O(V) |

## Common interview variations

- Course schedule I/II/IV, parallel courses (minimum semesters = longest path)
- Alien dictionary, sequence reconstruction (unique order ⇔ queue size always 1)
- Find eventual safe states, detect a cycle in a directed graph
- Build order / task scheduling, minimum time to complete jobs

> [!WARNING]
> Typical mistakes:
> - Reversing prerequisite edges incorrectly (`[a, b]` usually means b → a).
> - Forgetting to check `len(order) == n` to detect cycles.
> - Using topological sort on undirected graphs (undefined).
> - In alien dictionary, missing the invalid prefix case.

> [!REMEMBER]
> Topo order exists only for DAGs. Kahn: repeatedly take in-degree-0 nodes; fewer than V output → cycle. DFS: reverse post-order. Process DP over DAGs in topological order.
