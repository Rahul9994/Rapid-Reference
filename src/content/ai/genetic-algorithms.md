A **genetic algorithm (GA)** searches by imitating natural evolution: a **population** of candidate solutions competes, the fittest reproduce, their "genes" mix through **crossover**, and random **mutation** adds novelty. Over generations the population evolves toward good solutions — no gradients or problem-specific search rules required.

## The ingredients

| Term | Meaning | In the lab |
|---|---|---|
| **Individual / chromosome** | one candidate solution, encoded as a string of genes | a 15-character string |
| **Gene** | one position in the encoding | one character |
| **Population** | the current set of candidates | 60 strings |
| **Fitness function** | how good a candidate is | number of characters matching `RAPID_REFERENCE` |
| **Selection** | choosing parents, favouring fitter ones | the top third may breed |
| **Crossover** | combining two parents | prefix of one + suffix of the other |
| **Mutation** | small random changes | each character flips with a small probability |
| **Elitism** | copying the best few unchanged | the top 2 survive as-is |

## The loop

1. Create a random initial population.
2. Evaluate everyone's fitness.
3. **Select** parents (fitter → more likely).
4. **Crossover** pairs of parents to make children.
5. **Mutate** children slightly.
6. Replace the population (keeping elites) and repeat until a solution is good enough or a generation limit is hit.

```python
import random

TARGET = "RAPID_REFERENCE"
GENES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ_"
rng = random.Random(42)

def fitness(s):
    return sum(a == b for a, b in zip(s, TARGET))

def random_string():
    return "".join(rng.choice(GENES) for _ in TARGET)

def mutate(s, rate):
    return "".join(rng.choice(GENES) if rng.random() < rate else c for c in s)

population = [random_string() for _ in range(60)]
for generation in range(500):
    population.sort(key=fitness, reverse=True)
    if fitness(population[0]) == len(TARGET):
        break
    parents = population[:20]                         # truncation selection
    children = population[:2]                         # elitism
    while len(children) < 60:
        a, b = rng.sample(parents, 2)
        cut = rng.randrange(len(TARGET))              # single-point crossover
        children.append(mutate(a[:cut] + b[cut:], rate=1 / len(TARGET)))
    population = children

print(f"solved in generation {generation}: {population[0]}")
```

```output
solved in generation 39: RAPID_REFERENCE
```

A random string matches by pure chance with probability $(1/27)^{15} \approx 3.4 \times 10^{-22}$; selection + crossover + mutation get there in a few dozen generations.

## Selection methods

- **Fitness-proportionate (roulette wheel)** — probability ∝ fitness; struggles when fitness values are close or wildly different.
- **Tournament selection** — pick $k$ random individuals, keep the best; easy to tune pressure via $k$. The most common choice.
- **Rank selection** — probability by rank, not raw fitness.
- **Truncation** — only the top fraction breeds (used above).

## Crossover and mutation operators

- **Single-point / two-point / uniform crossover** for strings and bit vectors.
- **Order crossover (OX)** and **swap / inversion mutation** for permutations (e.g. TSP tours), so children remain valid permutations.
- **Gaussian mutation** for real-valued genes.

## Balancing exploration and exploitation

| Too much… | Symptom | Fix |
|---|---|---|
| selection pressure / elitism | population becomes identical early → **premature convergence** on a local optimum | larger population, more mutation, tournament with small $k$ |
| mutation | search becomes random, good solutions get destroyed | lower mutation rate, elitism |

Try the lab's mutation slider: at 0 the population can stall missing a character no one has; very high rates scramble progress.

## When to use GAs

Good for large, rugged, poorly understood search spaces with a cheap fitness function and no gradient: scheduling and timetabling, design optimisation (e.g. antenna shapes), feature selection, game strategies, hyperparameter search. Usually **not** the best choice when gradients exist (use gradient descent) or the structure allows exact algorithms.

> [!WARNING]
> - A fitness function that is expensive to compute — GAs evaluate it thousands of times.
> - Encodings where crossover produces invalid solutions (use permutation-aware operators).
> - No elitism, so the best solution found can be lost.
> - Treating a GA as guaranteed to find the optimum — it is a heuristic.

## Interview questions

> [!INTERVIEW] Explain how a genetic algorithm works.
> Maintain a population of encoded candidate solutions; each generation, evaluate fitness, select fitter parents, recombine them with crossover, apply random mutation, and form the next generation, repeating until convergence.

> [!INTERVIEW] What is the role of mutation vs crossover?
> Crossover exploits — it combines good building blocks from parents. Mutation explores — it introduces genes not present in the population and prevents premature convergence.

> [!INTERVIEW] What is premature convergence?
> The population loses diversity and settles on a local optimum early. Countered with larger populations, higher mutation, less aggressive selection, or diversity-preserving techniques.

> [!REMEMBER]
> Population → fitness → selection → crossover → mutation → repeat · elitism keeps the best · tournament selection is common · crossover exploits, mutation explores · beware premature convergence.
