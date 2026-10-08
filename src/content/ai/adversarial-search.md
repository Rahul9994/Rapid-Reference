In games like chess, tic-tac-toe or Go, an opponent works *against* you. **Adversarial search** plans assuming the opponent plays as well as possible. **Minimax** computes the best move under that assumption; **alpha–beta pruning** gets the same answer while skipping branches that can't matter.

## Game trees

A two-player, turn-based, **zero-sum**, perfect-information game can be written as a tree:

- nodes are game positions; edges are moves;
- **MAX** (▲, you) and **MIN** (▼, the opponent) alternate levels;
- leaves are terminal positions with a **utility** (e.g. +1 win, 0 draw, −1 loss — or a score).

## Minimax

The minimax value of a node is the outcome if both sides play optimally from there:

$$
\text{minimax}(n) =
\begin{cases}
\text{utility}(n) & \text{if } n \text{ is terminal} \\
\max_{c} \text{minimax}(c) & \text{if MAX is to move} \\
\min_{c} \text{minimax}(c) & \text{if MIN is to move}
\end{cases}
$$

It is a depth-first traversal that backs values up from the leaves — exactly what the lab animates. Time $O(b^m)$, space $O(bm)$ for branching factor $b$ and depth $m$. Chess has $b \approx 35$, so full search is impossible; real engines search to a limited depth and use an **evaluation function** to score non-terminal positions.

## Alpha–beta pruning

Carry two bounds down the tree:

- **α** — the best value MAX can already guarantee on the path so far (starts at −∞);
- **β** — the best value MIN can already guarantee (starts at +∞).

If at any node **α ≥ β**, the remaining children can't change the result — the player above would never let the game reach this node — so they are **pruned**.

> [!TIP] The intuition
> MAX already has a move worth 3. Exploring another move, MIN's first reply gives 2. MIN can hold MAX to ≤ 2 here, which is worse than 3, so MAX will never choose this move — no need to look at MIN's other replies.

```python
import math

# a depth-4 binary tree: MAX, MIN, MAX, MIN, then 16 leaf utilities
LEAVES = [3, 12, 8, 2, 4, 6, 14, 5, 2, 9, 1, 7, 11, 3, 6, 10]
visited = []

def alphabeta(i, alpha, beta, maximizing):
    if i >= 16:                                     # heap index 16..31 = leaves
        visited.append(i)
        return LEAVES[i - 16]
    best = -math.inf if maximizing else math.inf
    for child in (2 * i, 2 * i + 1):
        v = alphabeta(child, alpha, beta, not maximizing)
        if maximizing:
            best = max(best, v); alpha = max(alpha, best)
        else:
            best = min(best, v); beta = min(beta, best)
        if alpha >= beta:
            break                                   # prune the remaining child
    return best

def minimax(i, maximizing):
    if i >= 16:
        return LEAVES[i - 16]
    values = [minimax(2 * i, not maximizing), minimax(2 * i + 1, not maximizing)]
    return max(values) if maximizing else min(values)

print("minimax value:", minimax(1, True))
print("alpha-beta value:", alphabeta(1, -math.inf, math.inf, True))
print(f"leaves evaluated by alpha-beta: {len(visited)} of 16")
```

```output
minimax value: 3
alpha-beta value: 3
leaves evaluated by alpha-beta: 8 of 16
```

Same answer, half the leaves — the lab uses this exact tree.

## How much does pruning save?

It depends on **move ordering**. With perfect ordering (best moves first), alpha–beta examines about $O(b^{m/2})$ nodes instead of $O(b^m)$ — effectively doubling the searchable depth in the same time. With the worst ordering it saves nothing. Engines order moves with heuristics (captures first, killer moves, results from previous iterations).

## Beyond basic minimax

- **Depth-limited search + evaluation function** — e.g. material count and piece mobility in chess.
- **Iterative deepening** — search depth 1, 2, 3… within a time limit, reusing results to order moves.
- **Transposition tables** — cache positions reached by different move orders.
- **Expectiminimax** — adds *chance* nodes (averages) for games with dice, like backgammon.
- **Monte Carlo Tree Search (MCTS)** — estimates values from random playouts; combined with deep networks in AlphaGo.

> [!WARNING]
> - Thinking alpha–beta can change the result — it returns exactly the minimax value.
> - Forgetting that pruning only helps if children are explored in a good order.
> - Using minimax for games with chance or hidden information without adapting it (expectiminimax, or other methods).

## Interview questions

> [!INTERVIEW] Explain minimax.
> A depth-first search over the game tree that assumes both players play optimally: leaves get their utility, MAX nodes take the maximum of their children and MIN nodes the minimum. The root's best child is the move to play.

> [!INTERVIEW] What are alpha and beta?
> α is the best value the maximiser can guarantee so far along the path, β the best value the minimiser can guarantee. When α ≥ β, the current branch can't affect the decision and is pruned.

> [!INTERVIEW] What's the best-case complexity of alpha–beta?
> $O(b^{m/2})$ with perfect move ordering — the effective branching factor drops from $b$ to about $\sqrt{b}$.

> [!REMEMBER]
> MAX maximises, MIN minimises, values back up from leaves · α = MAX's guarantee, β = MIN's guarantee, prune when α ≥ β · same answer, $O(b^{m/2})$ best case · good move ordering matters · evaluation functions for deep games.
