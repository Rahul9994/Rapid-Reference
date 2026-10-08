Many AI problems — route finding, puzzle solving, planning — are **search problems**: find a sequence of actions that leads from a start state to a goal. **Uninformed** (blind) search strategies know nothing about where the goal is; they differ only in the order they explore. That order decides everything: speed, memory, and whether the answer is the best one.

## Formulating a search problem

| Component | Grid example in the lab |
|---|---|
| **State space** | every free cell |
| **Initial state** | S |
| **Actions** | move up / down / left / right (not into walls) |
| **Transition model** | the cell you land in |
| **Goal test** | is this G? |
| **Path cost** | 1 per step, 5 for stepping into mud |

Search builds a **search tree** from the initial state. The **frontier** (open list) holds discovered-but-unexpanded nodes; the **explored set** (closed list) prevents revisiting states — tree search without it can loop forever in graphs with cycles.

## Breadth-first search (BFS)

Expand the **shallowest** node first using a **FIFO queue**. It explores in rings of equal depth — watch the wavefront in the lab.

- Complete; **optimal when every step costs the same** (finds the fewest steps).
- Time and space $O(b^d)$ — memory is its weakness ($b$ = branching factor, $d$ = depth of the shallowest goal).

## Depth-first search (DFS)

Expand the **deepest** node first using a **LIFO stack** (or recursion). It dives down one branch before backtracking.

- Memory $O(b\,m)$ for tree search ($m$ = maximum depth) — tiny compared with BFS.
- **Not optimal** (finds *a* path, often a winding one) and incomplete in infinite spaces (can dive forever).

## Uniform-cost search (UCS / Dijkstra)

Expand the node with the **lowest path cost** $g(n)$ using a **priority queue**. With the lab's mud cells (cost 5), BFS happily walks through mud; UCS routes around it.

- Complete and **optimal for any non-negative step costs**.
- Equals Dijkstra's algorithm on graphs. With equal costs it behaves like BFS.

## Iterative deepening DFS (IDDFS)

Run depth-limited DFS with limit 0, 1, 2, … until the goal is found. It combines **BFS's optimality/completeness** (for unit costs) with **DFS's $O(bd)$ memory**. Re-expanding shallow levels costs little because most nodes are at the deepest level. It is the preferred uninformed method when the depth is unknown and the space is large.

## Comparison

| | BFS | DFS | UCS | IDDFS |
|---|---|---|---|---|
| Data structure | FIFO queue | LIFO stack | priority queue on $g$ | repeated DLS |
| Complete? | yes (finite $b$) | no in infinite spaces | yes (costs ≥ ε > 0) | yes |
| Optimal? | yes, if step costs equal | no | **yes** | yes, if step costs equal |
| Time | $O(b^d)$ | $O(b^m)$ | $O(b^{1 + C^*/\varepsilon})$ | $O(b^d)$ |
| Space | $O(b^d)$ | $O(bm)$ | $O(b^{1 + C^*/\varepsilon})$ | $O(bd)$ |

($C^*$ is the optimal path cost and $\varepsilon$ the smallest step cost.)

```python
from collections import deque
import heapq

GRID = ["S.#....",
        ".~#.##.",
        ".~...#.",
        "...#..G"]          # '#' wall, '~' mud (cost 5)

def neighbours(r, c):
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(GRID) and 0 <= nc < len(GRID[0]) and GRID[nr][nc] != "#":
            yield nr, nc

cost = lambda cell: 5 if GRID[cell[0]][cell[1]] == "~" else 1
start, goal = (0, 0), (3, 6)

def bfs():
    parent, q, expanded = {start: None}, deque([start]), 0
    while q:
        node = q.popleft(); expanded += 1
        if node == goal:
            return parent, expanded
        for nb in neighbours(*node):
            if nb not in parent:
                parent[nb] = node; q.append(nb)

def ucs():
    g, parent, pq, expanded = {start: 0}, {start: None}, [(0, start)], 0
    while pq:
        d, node = heapq.heappop(pq)
        if d > g[node]:
            continue
        expanded += 1
        if node == goal:
            return parent, expanded
        for nb in neighbours(*node):
            if d + cost(nb) < g.get(nb, float("inf")):
                g[nb] = d + cost(nb); parent[nb] = node
                heapq.heappush(pq, (g[nb], nb))

def path(parent):
    node, out = goal, []
    while node is not None:
        out.append(node); node = parent[node]
    return out[::-1]

for name, search in [("BFS", bfs), ("UCS", ucs)]:
    parent, expanded = search()
    p = path(parent)
    print(f"{name}: {len(p) - 1} steps, cost {sum(cost(c) for c in p[1:])}, expanded {expanded}")
```

```output
BFS: 9 steps, cost 13, expanded 19
UCS: 11 steps, cost 11, expanded 19
```

BFS finds the fewest steps but walks through mud; UCS takes a longer but cheaper route.

> [!WARNING]
> - Forgetting the explored set in graphs with cycles (infinite loops / exponential blow-up).
> - Calling BFS "optimal" without the equal-step-cost condition.
> - Checking the goal when a node is *generated* in UCS — that can return a suboptimal path; UCS must test when a node is *expanded* (popped).
> - Using recursion-based DFS on huge graphs in Python (recursion limit).

## Interview questions

> [!INTERVIEW] When is BFS optimal and when is it not?
> It finds the shallowest goal, so it is optimal when all actions cost the same. With varying costs, the fewest-steps path may not be the cheapest — use uniform-cost search.

> [!INTERVIEW] Why use iterative deepening?
> It gets BFS's completeness and (unit-cost) optimality with DFS's linear memory, at the price of re-expanding shallow nodes — which costs little because most nodes are in the deepest level.

> [!INTERVIEW] BFS vs DFS memory?
> BFS stores the whole frontier, $O(b^d)$; DFS stores one path plus siblings, $O(bm)$.

> [!REMEMBER]
> Frontier + explored set · BFS = queue (fewest steps) · DFS = stack (low memory, not optimal) · UCS = priority on g (cheapest, Dijkstra) · IDDFS = best of BFS + DFS · next: [Informed Search & A*](/ai/informed-search).
