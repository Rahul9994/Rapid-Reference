## What is the difference between AI, machine learning and deep learning?

**AI** is the broad goal of machines performing tasks that require intelligence, by any method — including search and hand-written rules. **Machine learning** is the subset that learns behaviour from data. **Deep learning** is the subset of ML using multi-layer neural networks. Generative AI is an application of deep learning that creates new content. See the [A.I track](/ai/introduction).

## What is the Turing test?

Proposed by Alan Turing in 1950: a human judge converses by text with a machine and a person; if the judge can't reliably tell which is the machine, it passes. It is criticised for testing convincing imitation rather than genuine understanding (e.g. Searle's Chinese Room argument).

## What is a rational agent? What is PEAS?

A rational agent chooses the action expected to maximise its performance measure given its percepts and knowledge. **PEAS** — Performance measure, Environment, Actuators, Sensors — is a checklist for specifying an agent's task, e.g. for a self-driving car: safety and speed; roads and traffic; steering and brakes; cameras, lidar and GPS.

## What are the types of intelligent agents?

Simple reflex (current percept → action via rules), model-based reflex (keeps internal state for partial observability), goal-based (plans to reach goals), utility-based (maximises a utility function to trade off outcomes) and learning agents (improve from feedback).

## BFS vs DFS vs uniform-cost search?

**BFS** expands the shallowest node (queue) — complete and optimal when every step costs the same, but uses O(bᵈ) memory. **DFS** expands the deepest node (stack) — O(bm) memory but not optimal. **Uniform-cost search** expands the cheapest path so far (priority queue) — optimal for any non-negative costs; it's Dijkstra's algorithm.

## How does A* search work? When is it optimal?

A* expands the node with the lowest f(n) = g(n) + h(n): the cost so far plus a heuristic estimate of the remaining cost. It is optimal when the heuristic is **admissible** (never overestimates) for tree search, and **consistent** (h(n) ≤ c(n, n') + h(n')) for graph search. With h = 0 it becomes uniform-cost search.

## What is minimax and how does alpha–beta pruning improve it?

Minimax searches a game tree assuming both players play optimally: MAX nodes take the maximum child value and MIN nodes the minimum. Alpha–beta keeps the best guaranteed values for MAX (α) and MIN (β) and prunes any branch where α ≥ β, because it can't affect the decision. It returns the same result and, with good move ordering, examines about O(b^(m/2)) nodes instead of O(b^m).

## What is the difference between hill climbing and simulated annealing?

Hill climbing always moves to a better neighbour and gets stuck at local maxima, plateaus and ridges. Simulated annealing sometimes accepts worse moves with probability e^(Δ/T); the temperature T starts high (exploration) and decreases (exploitation), letting it escape local optima.

## What is a constraint satisfaction problem?

A problem defined by variables, domains of possible values, and constraints on combinations — such as Sudoku, map colouring or timetabling. It's solved with backtracking search improved by heuristics like MRV (most constrained variable first) and inference such as forward checking and arc consistency (AC-3).

## Forward chaining vs backward chaining?

**Forward chaining** is data-driven: start from known facts and fire rules whose premises are satisfied until the goal is derived. **Backward chaining** is goal-driven: start from the query and recursively try to prove the premises of rules that conclude it (as in Prolog). Forward suits monitoring and deriving everything; backward suits answering specific questions.

## Explain Bayes' theorem with an example.

P(H | E) = P(E | H) · P(H) / P(E): the posterior equals likelihood times prior, divided by the evidence. For a disease with 1% prevalence and a test with 95% sensitivity and 90% specificity, a positive result means only about a 9% chance of having the disease, because false positives from the large healthy population dominate.

## What is a Markov decision process?

A model for sequential decisions under uncertainty: states, actions, transition probabilities P(s' | s, a), rewards and a discount factor γ. The optimal value satisfies the Bellman equation V(s) = R(s) + γ · maxₐ Σ P(s' | s, a) V(s'), solved by value iteration or policy iteration.

## What is Q-learning?

A model-free reinforcement-learning algorithm that learns action values with the update Q(s, a) ← Q(s, a) + α[r + γ · maxₐ' Q(s', a') − Q(s, a)]. It is off-policy: it learns the greedy policy's value while exploring, typically with ε-greedy action selection.

## What is the exploration–exploitation trade-off?

An agent must exploit the best-known action to collect reward but also explore other actions to discover better ones. Too little exploration locks in a suboptimal policy; too much wastes reward. Common strategies: ε-greedy (often with decaying ε), upper confidence bounds and optimistic initialisation.

## What is self-attention in transformers?

Each token is projected into a query, key and value. A token's new representation is the softmax-weighted average of all values, with weights from its query's dot products with every key, scaled by √dₖ. It lets every token use context from any position in parallel; multi-head attention runs several such patterns at once.

## What is temperature in LLM sampling?

Logits are divided by the temperature before softmax. Low temperature sharpens the distribution (more deterministic, factual), high temperature flattens it (more diverse and creative, but more errors). Top-k and top-p (nucleus) sampling restrict sampling to the most likely tokens.

## Why do LLMs hallucinate and how can it be reduced?

They're trained to produce plausible continuations rather than verified facts, have a knowledge cutoff and may sample low-probability tokens. Mitigations include retrieval-augmented generation (RAG) with sources, lower temperature, tool use, asking the model to say when it is unsure, and human or automated verification.

## How can an AI system be unfair, and how do you measure it?

Bias enters through historical data, unrepresentative samples, biased labels, proxy features and feedback loops. Measure per-group outcomes with criteria such as demographic parity (equal approval rates), equal opportunity (equal true-positive rates) and equalized odds (equal TPR and FPR). When base rates differ, these criteria can't all be satisfied at once, so the choice must be deliberate and documented.
