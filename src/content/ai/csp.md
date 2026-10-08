A **constraint satisfaction problem (CSP)** asks for values for a set of variables such that every constraint is satisfied — Sudoku, timetabling, map colouring, scheduling exams so no student has two at once. Because the structure is explicit, CSP solvers can prune huge parts of the search space instead of blindly trying combinations.

## Formulation

A CSP has three parts:

- **Variables** $X = \{X_1, \dots, X_n\}$ — e.g. the 7 Australian regions WA, NT, SA, Q, NSW, V, T.
- **Domains** $D_i$ — allowed values for each variable, e.g. {red, green, blue}.
- **Constraints** $C$ — which combinations are allowed, e.g. $SA \ne WA$ for every pair of neighbouring regions.

A **solution** is a *complete* and *consistent* assignment. Binary constraints can be drawn as a **constraint graph** — the lab's map.

| Constraint type | Example |
|---|---|
| Unary | $SA \ne \text{green}$ |
| Binary | $SA \ne WA$ |
| Global (higher-order) | *AllDifferent* across a Sudoku row |

## Backtracking search

Depth-first search over partial assignments: pick an unassigned variable, try each value consistent with the assignments so far, recurse; if a variable has no consistent value, **backtrack** to the previous decision.

```python
NEIGHBOURS = {
    "WA": ["NT", "SA"], "NT": ["WA", "SA", "Q"], "SA": ["WA", "NT", "Q", "NSW", "V"],
    "Q": ["NT", "SA", "NSW"], "NSW": ["Q", "SA", "V"], "V": ["SA", "NSW"], "T": [],
}
COLORS = ["red", "green", "blue"]
calls = 0

def backtrack(assignment, order, use_mrv):
    global calls
    calls += 1
    if len(assignment) == len(NEIGHBOURS):
        return assignment
    unassigned = [v for v in order if v not in assignment]
    if use_mrv:   # Minimum Remaining Values: the variable with the fewest legal colours
        legal = lambda v: sum(all(assignment.get(n) != c for n in NEIGHBOURS[v]) for c in COLORS)
        var = min(unassigned, key=legal)
    else:
        var = unassigned[0]
    for color in COLORS:
        if all(assignment.get(n) != color for n in NEIGHBOURS[var]):
            assignment[var] = color
            if backtrack(assignment, order, use_mrv):
                return assignment
            del assignment[var]                       # undo and try the next colour
    return None

order = ["WA", "NT", "NSW", "Q", "SA", "V", "T"]       # a deliberately bad order
for use_mrv in [False, True]:
    calls = 0
    solution = backtrack({}, order, use_mrv)
    print(f"MRV={use_mrv}: {calls} calls ->", solution)
```

```output
MRV=False: 10 calls -> {'WA': 'red', 'NT': 'green', 'NSW': 'green', 'Q': 'red', 'SA': 'blue', 'V': 'red', 'T': 'red'}
MRV=True: 8 calls -> {'WA': 'red', 'NT': 'green', 'SA': 'blue', 'Q': 'red', 'NSW': 'green', 'V': 'red', 'T': 'red'}
```

## Making backtracking smart

**Variable ordering**

- **MRV (minimum remaining values)** — choose the variable with the fewest legal values left ("fail first"): if a variable is going to cause a dead end, find out now.
- **Degree heuristic** — break ties by picking the variable involved in the most constraints with unassigned variables (SA in Australia).

**Value ordering**

- **Least constraining value** — try the value that rules out the fewest choices for neighbours ("succeed first").

**Inference (look-ahead)**

- **Forward checking** — after assigning $X$, delete inconsistent values from the domains of $X$'s unassigned neighbours; if any domain becomes empty, backtrack immediately. In the lab, watch domain dots disappear and a dead end get caught before it happens.
- **Arc consistency (AC-3)** — make every arc $X \to Y$ consistent: each value of $X$ must have some compatible value of $Y$. Propagates further than forward checking; it can be run as preprocessing or after every assignment (MAC).

Switch the lab between *Backtracking*, *+ Forward checking* and *+ MRV* to compare the number of assignments and backtracks.

## Local search for CSPs

**Min-conflicts**: start with a complete (possibly inconsistent) assignment; repeatedly pick a conflicted variable and give it the value that minimises conflicts. Astonishingly effective on large problems such as million-queen puzzles and scheduling.

## Structure helps

- Independent subproblems (Tasmania has no neighbours) can be solved separately.
- **Tree-structured** constraint graphs are solvable in $O(n\,d^2)$ time (linear in the number of variables).
- General CSPs are NP-complete, so the heuristics above are what make real problems tractable.

> [!WARNING]
> - Checking constraints only when the assignment is complete (generate-and-test) — exponential and hopeless.
> - Forgetting to undo domain pruning when backtracking.
> - Confusing MRV ("most constrained variable first") with least-constraining-value ("least constraining *value* first").

## Interview questions

> [!INTERVIEW] What is a CSP? Give an example.
> Variables with domains plus constraints restricting combinations; a solution assigns every variable without violating any constraint. Examples: Sudoku, map colouring, timetabling, N-queens.

> [!INTERVIEW] What does forward checking do?
> After each assignment, it removes now-inconsistent values from neighbouring unassigned variables' domains and backtracks immediately if any domain becomes empty — detecting failures earlier.

> [!INTERVIEW] What is the MRV heuristic and why does it help?
> Choose the unassigned variable with the fewest remaining legal values. It confronts the most likely failure point first, pruning bad branches early.

> [!REMEMBER]
> Variables + domains + constraints · backtracking DFS · MRV + degree (which variable), least-constraining value (which value) · forward checking & AC-3 propagate · min-conflicts for huge problems.
