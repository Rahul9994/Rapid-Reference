Sometimes the *path* doesn't matter — only the final state does: a schedule, a chip layout, a set of weights. **Local search** keeps just one (or a few) current states and repeatedly moves to a neighbouring state that scores better. It uses almost no memory and works in huge or continuous spaces where systematic search is hopeless.

## The landscape view

Picture every possible state laid out on the x-axis and its **objective** (score) $f(x)$ as height — the lab's curve. Local search walks on this landscape:

- **Global maximum** — the best state overall.
- **Local maximum** — higher than all neighbours, but not the best.
- **Plateau** — a flat region where neighbours have equal scores.
- **Ridge** — a narrow uphill path that single steps keep falling off.

## Hill climbing (steepest ascent)

From the current state, look at all neighbours and move to the best one; stop when no neighbour is better.

```python
def hill_climb(f, x, step=0.2):
    while True:
        best = max([x - step, x + step], key=f)
        if f(best) <= f(x):
            return x              # no uphill neighbour: a (local) maximum
        x = best
```

It is fast and greedy — and it **gets stuck** on the first peak it climbs. In the lab, plain hill climbing from the left ends on a small hill.

### Variants

| Variant | Idea |
|---|---|
| **Stochastic hill climbing** | pick a random uphill neighbour |
| **First-choice** | take the first improving neighbour found (good when there are many neighbours) |
| **Random-restart** | run hill climbing from many random starts; keep the best result |
| **Sideways moves** | allow a limited number of equal-score moves to cross plateaus |

Random restarts are surprisingly effective: if one climb succeeds with probability $p$, about $1/p$ restarts are expected to find the global maximum.

## Simulated annealing

Inspired by annealing metal (heating, then cooling slowly): pick a **random** neighbour; always accept it if it's better; if it's worse by $\Delta < 0$, accept it anyway with probability

$$
P(\text{accept}) = e^{\Delta / T}
$$

The **temperature** $T$ starts high (accept many bad moves — explore) and decreases (accept fewer — exploit). At $T \to 0$ it becomes hill climbing. Bad moves are what let it escape local maxima.

```python
import math, random

f = lambda x: math.sin(x) + 0.6 * math.sin(3 * x) + 0.05 * x   # bumpy landscape on [0, 10]

def hill_climb(x, step=0.05):
    while True:
        best = max([max(0, x - step), min(10, x + step)], key=f)
        if f(best) <= f(x):
            return x
        x = best

def anneal(x, rng, T=2.0, cooling=0.995):
    while T > 1e-3:
        nxt = min(10, max(0, x + rng.uniform(-1.5, 1.5)))
        delta = f(nxt) - f(x)
        if delta > 0 or rng.random() < math.exp(delta / T):
            x = nxt
        T *= cooling
    return x

best = max(f(i / 1000) for i in range(10001))          # brute-force global max
rng = random.Random(0)
starts = [rng.uniform(0, 10) for _ in range(100)]
hc = sum(f(hill_climb(x)) > best - 0.01 for x in starts)
sa = sum(f(anneal(x, rng)) > best - 0.01 for x in starts)
print(f"global max f = {best:.3f}")
print(f"reached it from 100 random starts: hill climbing {hc}, simulated annealing {sa}")
```

```output
global max f = 1.602
reached it from 100 random starts: hill climbing 31, simulated annealing 49
```

Hill climbing only succeeds when it happens to start on the right hill; annealing's early random moves let it reach the global peak noticeably more often (not always — this cooling schedule is fairly fast; slower cooling raises the success rate).

The schedule matters: cooling too fast behaves like hill climbing; in theory, a slow enough (logarithmic) schedule finds the global optimum with probability approaching 1 — too slow in practice, so geometric cooling ($T \leftarrow \alpha T$, $\alpha \approx 0.95$–$0.999$) is common.

## Other local search methods

- **Local beam search** — keep the $k$ best states; generate all their neighbours and keep the best $k$.
- **Tabu search** — forbid recently visited states to avoid cycling.
- **Genetic algorithms** — a population, recombined and mutated ([Genetic Algorithms](/ai/genetic-algorithms)).
- **Gradient descent** — local search in continuous spaces using the gradient ([Gradient Descent](/ml/gradient-descent)).

Classic applications: the **8-queens** problem (min-conflicts reaches solutions for even a million queens very quickly), travelling salesman tours (2-opt moves), timetabling, VLSI layout.

> [!WARNING]
> - Expecting hill climbing to find the global optimum on bumpy landscapes.
> - Cooling too fast in annealing (it freezes into a local optimum).
> - Forgetting that local search is not complete — it may never find a solution even if one exists.

## Interview questions

> [!INTERVIEW] What is the main weakness of hill climbing and how do you address it?
> It gets stuck at local maxima, plateaus and ridges. Fixes: random restarts, sideways moves, stochastic variants, or simulated annealing.

> [!INTERVIEW] How does simulated annealing escape local maxima?
> It sometimes accepts worse moves, with probability $e^{\Delta/T}$ — high when the temperature is high or the move is only slightly worse — and gradually lowers the temperature.

> [!INTERVIEW] Is local search complete or optimal?
> Generally neither: it can miss solutions and stop at local optima. Its advantage is constant memory and good solutions fast in huge spaces.

> [!REMEMBER]
> Only the final state matters · hill climbing = greedy uphill, stuck on local maxima · random restarts · annealing accepts bad moves with $e^{\Delta/T}$, cool slowly · beam, tabu, GA, gradient descent.
