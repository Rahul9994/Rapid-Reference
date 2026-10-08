**Informed (heuristic) search** uses a **heuristic** $h(n)$ — an estimate of the cost from node $n$ to the goal — to explore promising directions first. **A\*** combines that estimate with the known cost so far and is the standard algorithm for shortest paths in games, maps and robotics.

## Heuristics

A heuristic is a cheap, problem-specific guess of the remaining cost:

| Problem | Heuristic |
|---|---|
| Grid, 4-directional moves | **Manhattan distance** $\lvert x_1 - x_2\rvert + \lvert y_1 - y_2\rvert$ |
| Grid, 8-directional moves | Chebyshev / octile distance |
| Road map | straight-line (Euclidean) distance |
| 8-puzzle | number of misplaced tiles, or sum of Manhattan distances of tiles |

## Greedy best-first search

Expand the node with the smallest $h(n)$ — whatever *looks* closest to the goal. It is often very fast but **not optimal** (it ignores how much the path has already cost) and can be led into dead ends. Switch the lab to **Greedy** and watch it rush toward G, sometimes the long way around.

## A\* search

A\* orders the frontier by

$$
f(n) = g(n) + h(n)
$$

- $g(n)$ — the actual cost from the start to $n$ (what UCS uses);
- $h(n)$ — the estimated cost from $n$ to the goal (what greedy uses);
- $f(n)$ — the estimated total cost of the cheapest solution through $n$.

With $h = 0$, A\* becomes uniform-cost search (Dijkstra). A good $h$ lets it ignore huge parts of the map — compare how many cells A\* and UCS expand in the lab.

## When is A\* optimal?

- **Admissible** heuristic: never overestimates, $h(n) \le h^*(n)$ (the true cost). Then A\* *tree search* is optimal.
- **Consistent** (monotone) heuristic: $h(n) \le c(n, n') + h(n')$ for every edge — the triangle inequality. Then $f$ never decreases along a path, so the first time A\* expands a node it has the optimal path to it (graph search is optimal without re-opening nodes). Consistency implies admissibility.

Manhattan distance on a 4-connected grid with step costs ≥ 1 is consistent, so the lab's A\* always returns the cheapest path.

> [!TIP] Better heuristics, less work
> If $h_2(n) \ge h_1(n)$ for all $n$ and both are admissible, $h_2$ **dominates** $h_1$ and A\* with $h_2$ expands no more nodes. Admissible heuristics often come from **relaxed problems** (e.g. ignore walls → Manhattan distance).

```python
import heapq

GRID = ["...............",
        "...............",
        "......#####....",
        "S.........#...G",          # a U-shaped wall blocks the direct route
        "......#####....",
        "...............",
        "..............."]

def neighbours(r, c):
    for dr, dc in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
        nr, nc = r + dr, c + dc
        if 0 <= nr < len(GRID) and 0 <= nc < len(GRID[0]) and GRID[nr][nc] != "#":
            yield nr, nc

start, goal = (3, 0), (3, 14)
manhattan = lambda n: abs(n[0] - goal[0]) + abs(n[1] - goal[1])

def search(priority):
    g, pq, expanded, closed = {start: 0}, [(priority(0, start), start)], 0, set()
    while pq:
        _, node = heapq.heappop(pq)
        if node in closed:
            continue
        closed.add(node)
        expanded += 1
        if node == goal:
            return g[node], expanded
        for nb in neighbours(*node):
            if g[node] + 1 < g.get(nb, float("inf")):
                g[nb] = g[node] + 1
                heapq.heappush(pq, (priority(g[nb], nb), nb))
    return None, expanded

for name, prio in [("UCS (h = 0)", lambda g, n: g),
                   ("Greedy (h only)", lambda g, n: manhattan(n)),
                   ("A* (g + h)", lambda g, n: g + manhattan(n))]:
    cost, expanded = search(prio)
    print(f"{name:16s} path cost {cost}, nodes expanded {expanded}")
```

```output
UCS (h = 0)      path cost 18, nodes expanded 94
Greedy (h only)  path cost 18, nodes expanded 24
A* (g + h)       path cost 18, nodes expanded 45
```

All three find a cost-18 path here, but A\* explores about half as many cells as UCS. Greedy is fastest on this map — yet it carries no optimality guarantee: it walks straight into the wall's pocket and only escapes because this pocket is shallow.

## Comparison

| | Greedy best-first | UCS | A\* |
|---|---|---|---|
| Priority | $h(n)$ | $g(n)$ | $g(n) + h(n)$ |
| Optimal | no | yes | yes, with an admissible/consistent $h$ |
| Nodes explored | often fewest | many | few (depends on $h$ quality) |
| Memory | high | high | high — keeps the whole frontier |

## Memory-bounded variants

A\*'s weakness is memory (it stores every generated node). **IDA\*** (iterative deepening A\*) uses depth-first search with an increasing $f$-limit; **SMA\*** drops the worst nodes when memory is full. **Weighted A\*** ($f = g + w\,h$, $w > 1$) trades optimality for speed.

> [!WARNING]
> - Using an inadmissible heuristic (e.g. Euclidean distance × 2) and still claiming optimality.
> - Using Manhattan distance when diagonal moves are allowed — it overestimates, so it's not admissible.
> - Stopping when the goal is *generated* instead of when it is *expanded*.

## Interview questions

> [!INTERVIEW] What is A\* and why does it work?
> A best-first search that expands the node with the smallest $f = g + h$. With an admissible heuristic it never discards the optimal path, and it explores far fewer nodes than uninformed search because $h$ steers it toward the goal.

> [!INTERVIEW] Admissible vs consistent heuristic?
> Admissible: never overestimates the true remaining cost. Consistent: $h(n) \le c(n, n') + h(n')$ for every neighbour, so $f$ never decreases along a path. Consistent ⇒ admissible, and it makes A\* graph search optimal without reopening nodes.

> [!INTERVIEW] What happens to A\* if $h = 0$? If $h$ is perfect?
> With $h = 0$ it becomes uniform-cost search (Dijkstra). With the exact cost-to-go it walks straight along an optimal path, expanding only nodes on it (ties aside).

> [!REMEMBER]
> Greedy = h (fast, not optimal) · UCS = g · A\* = g + h · admissible ⇒ optimal tree search, consistent ⇒ optimal graph search · dominating heuristics expand fewer nodes · memory is A\*'s weakness.
