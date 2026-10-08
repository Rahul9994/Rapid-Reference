A **Markov decision process (MDP)** models sequential decision-making when actions have **uncertain outcomes**: a robot that might slip, an inventory that might sell out. Solving an MDP gives a **policy** — the best action in every state — rather than a single plan, because the agent can't know in advance where it will end up.

## The ingredients

An MDP is a tuple $(S, A, P, R, \gamma)$:

| Component | Meaning | Lab (4 × 3 grid world) |
|---|---|---|
| $S$ | states | the 11 free squares |
| $A$ | actions | up, down, left, right |
| $P(s' \mid s, a)$ | transition model | 80% intended direction, 10% each side; bumping a wall = stay |
| $R(s)$ | reward | +1 and −1 exits; $-0.04$ per step elsewhere |
| $\gamma \in [0, 1]$ | discount factor | how much future rewards are worth now |

The **Markov property**: the next state depends only on the current state and action, not on the history.

## Policies, returns and values

- A **policy** $\pi(s)$ picks an action in each state.
- The **return** is the discounted sum of rewards $R_0 + \gamma R_1 + \gamma^2 R_2 + \dots$ — $\gamma < 1$ makes near rewards count more and keeps infinite sums finite.
- The **value** $V^\pi(s)$ is the expected return from $s$ when following $\pi$. The optimal value $V^*(s)$ is the best achievable.

## The Bellman equation

The value of a state is its reward now plus the discounted value of where the best action is expected to lead:

$$
V^*(s) = R(s) + \gamma \max_{a} \sum_{s'} P(s' \mid s, a)\, V^*(s')
$$

The optimal policy then just looks one step ahead:

$$
\pi^*(s) = \arg\max_{a} \sum_{s'} P(s' \mid s, a)\, V^*(s')
$$

## Value iteration

Start with $V(s) = 0$ and repeatedly apply the Bellman equation as an update to every state until the largest change $\Delta$ is tiny. The lab sweeps state by state: value spreads outward from the +1 exit, and the arrows (greedy policy) settle long before the numbers stop changing.

```python
W, H = 4, 3
WALL, TERMINAL = {(1, 1)}, {(3, 2): 1.0, (3, 1): -1.0}   # (x, y), y = 0 is the bottom row
STATES = [(x, y) for x in range(W) for y in range(H) if (x, y) not in WALL]
MOVES = {"U": (0, 1), "D": (0, -1), "L": (-1, 0), "R": (1, 0)}
SIDES = {"U": "LR", "D": "LR", "L": "UD", "R": "UD"}

def step(s, a):
    nxt = (s[0] + MOVES[a][0], s[1] + MOVES[a][1])
    return s if nxt in WALL or not (0 <= nxt[0] < W and 0 <= nxt[1] < H) else nxt

def P(s, a):   # 80% intended, 10% each perpendicular direction
    return [(0.8, step(s, a)), (0.1, step(s, SIDES[a][0])), (0.1, step(s, SIDES[a][1]))]

def value_iteration(gamma=1.0, R=-0.04, eps=1e-4):
    V = {s: 0.0 for s in STATES}
    while True:
        delta = 0.0
        for s in STATES:
            new = TERMINAL[s] if s in TERMINAL else R + gamma * max(
                sum(p * V[s2] for p, s2 in P(s, a)) for a in MOVES)
            delta = max(delta, abs(new - V[s]))
            V[s] = new
        if delta < eps:
            return V

V = value_iteration()
policy = {s: max(MOVES, key=lambda a: sum(p * V[s2] for p, s2 in P(s, a)))
          for s in STATES if s not in TERMINAL}
for y in reversed(range(H)):
    print("  ".join("  ####  " if (x, y) in WALL else
                    f"{V[(x, y)]:+.3f}{policy.get((x, y), ' ')}" for x in range(W)))
```

```output
+0.812R  +0.868R  +0.918R  +1.000 
+0.762U    ####    +0.660U  -1.000 
+0.705U  +0.655L  +0.611L  +0.388L
```

These are the textbook values for this world. Note the bottom-right square: it is next to the −1 exit, so the optimal policy goes **left** (the long way round) rather than risk slipping into −1.

## How rewards and discount shape behaviour

- A small negative step reward ($-0.04$) encourages reaching the exit reasonably quickly but carefully.
- A **large** step penalty (e.g. $-2$) makes the agent so desperate to leave that it will even dive into the −1 exit.
- A **positive** step reward makes it avoid exits altogether and wander forever.
- Smaller $\gamma$ makes the agent short-sighted.

Try the lab's sliders.

## Policy iteration

Alternate two steps until the policy stops changing:

1. **Policy evaluation** — compute $V^\pi$ for the current policy (solve a linear system or iterate).
2. **Policy improvement** — make the policy greedy with respect to $V^\pi$.

It usually converges in very few iterations, each more expensive than a value-iteration sweep.

## From planning to learning

Value and policy iteration need the **model** ($P$ and $R$). When the agent doesn't know them and must learn from experience, we are in [Reinforcement Learning](/ai/reinforcement-learning). Partially observable worlds are modelled as **POMDPs**.

> [!WARNING]
> - Forgetting the Markov property — if history matters, put it into the state.
> - Using $\gamma = 1$ in tasks that may never end (values can diverge).
> - Confusing reward (immediate) with value (long-term expected return).

## Interview questions

> [!INTERVIEW] What is the Bellman equation?
> A recursive definition of value: a state's value is its immediate reward plus the discounted expected value of the next state under the best action. Value iteration applies it repeatedly until convergence.

> [!INTERVIEW] What does the discount factor do?
> It weights future rewards by $\gamma^t$: smaller $\gamma$ favours immediate rewards; $\gamma < 1$ also guarantees finite returns in infinite-horizon problems.

> [!INTERVIEW] Value iteration vs policy iteration?
> Value iteration repeatedly applies the Bellman optimality update to values and extracts the policy at the end. Policy iteration alternates full policy evaluation with greedy improvement; it needs fewer (but costlier) iterations.

> [!REMEMBER]
> MDP = (S, A, P, R, γ) · Markov property · policy maps states to actions · Bellman: $V = R + \gamma \max_a \sum P\,V'$ · value iteration / policy iteration need the model · RL learns without it.
