A **knowledge-based agent** stores facts about the world in a **knowledge base (KB)** written in a formal language, and uses **inference** to derive new facts it was never told. Logic gives that language precise meaning, so conclusions are guaranteed correct whenever the premises are.

## Propositional logic

Sentences are built from **symbols** ($P$, $Q$, *Raining*) that are either true or false, combined with connectives:

| Connective | Symbol | True when |
|---|---|---|
| not | $\neg P$ | $P$ is false |
| and | $P \land Q$ | both are true |
| or | $P \lor Q$ | at least one is true |
| implies | $P \Rightarrow Q$ | $P$ is false, or $Q$ is true |
| if and only if | $P \Leftrightarrow Q$ | both have the same value |

$P \Rightarrow Q$ is only false when $P$ is true and $Q$ is false — "if it rains, the grass is wet" isn't violated on dry days.

Key ideas:

- **Model** — an assignment of true/false to every symbol (a possible world).
- **Entailment** $KB \models \alpha$ — $\alpha$ is true in **every** model where the KB is true.
- **Valid** (tautology) — true in all models, e.g. $P \lor \neg P$. **Satisfiable** — true in at least one model.
- **Sound** inference derives only entailed sentences; **complete** inference derives all of them.

Useful equivalences: $P \Rightarrow Q \equiv \neg P \lor Q$ · De Morgan: $\neg(P \land Q) \equiv \neg P \lor \neg Q$ · contrapositive: $P \Rightarrow Q \equiv \neg Q \Rightarrow \neg P$.

## Inference rules

- **Modus ponens**: from $P \Rightarrow Q$ and $P$, infer $Q$.
- **And-elimination**: from $P \land Q$, infer $P$.
- **Resolution**: from $P \lor Q$ and $\neg Q \lor R$, infer $P \lor R$. Resolution alone is complete for propositional logic (prove $KB \models \alpha$ by showing $KB \land \neg\alpha$ is unsatisfiable).
- **Model checking** — enumerate truth tables; correct but $O(2^n)$.

## Horn clauses, forward and backward chaining

A **Horn clause** has at most one positive literal — usually written as a rule $A \land B \Rightarrow C$ or a fact $A$. For Horn KBs, inference with modus ponens is efficient (linear time).

The lab's knowledge base (a classic textbook example):

$$
P \Rightarrow Q, \quad L \land M \Rightarrow P, \quad B \land L \Rightarrow M, \quad A \land P \Rightarrow L, \quad A \land B \Rightarrow L, \quad A, \quad B
$$

**Forward chaining** (data-driven): start from known facts; whenever all premises of a rule are known, add its conclusion; stop when the query appears or nothing new can be derived.

**Backward chaining** (goal-driven): start from the query $Q$; to prove it, find rules concluding $Q$ and recursively prove their premises. Used by Prolog; efficient when you have a specific question.

```python
from collections import deque

RULES = [({"P"}, "Q"), ({"L", "M"}, "P"), ({"B", "L"}, "M"),
         ({"A", "P"}, "L"), ({"A", "B"}, "L")]
FACTS = ["A", "B"]

def forward_chaining(query):
    count = [len(premises) for premises, _ in RULES]   # unmet premises per rule
    inferred, agenda, order = set(), deque(FACTS), []
    while agenda:
        p = agenda.popleft()
        if p == query:
            return True, order + [p]
        if p in inferred:
            continue
        inferred.add(p); order.append(p)
        for i, (premises, conclusion) in enumerate(RULES):
            if p in premises:
                count[i] -= 1
                if count[i] == 0:
                    agenda.append(conclusion)
    return False, order

def backward_chaining(goal, seen=frozenset()):
    if goal in FACTS:
        return True
    if goal in seen:                                   # avoid infinite loops
        return False
    return any(all(backward_chaining(p, seen | {goal}) for p in premises)
               for premises, conclusion in RULES if conclusion == goal)

print("forward:", forward_chaining("Q"))
print("backward:", backward_chaining("Q"))
```

```output
forward: (True, ['A', 'B', 'L', 'M', 'P', 'Q'])
backward: True
```

## First-order logic (FOL)

Propositional logic can't say "all humans are mortal" without a separate symbol per human. FOL adds:

- **objects**, **predicates** (`Human(x)`), **functions** (`FatherOf(x)`);
- **quantifiers**: $\forall x\ \text{Human}(x) \Rightarrow \text{Mortal}(x)$ ("for all") and $\exists x\ \text{Loves}(x, \text{Ram})$ ("there exists").

Inference in FOL uses **unification** (finding substitutions like $x = \text{Socrates}$) with generalised modus ponens or resolution. FOL entailment is semi-decidable: a proof is found if one exists, but the search may not terminate if none does.

## Where it's used

Expert systems (MYCIN, rule engines), Prolog, theorem provers, SAT solvers (hardware verification, scheduling), knowledge graphs and the semantic web, and business-rule engines. Pure logic struggles with uncertainty — which is what [probabilistic reasoning](/ai/probabilistic-reasoning) handles.

> [!WARNING]
> - Reading $P \Rightarrow Q$ as "P causes Q" — it is purely truth-functional.
> - Affirming the consequent: from $P \Rightarrow Q$ and $Q$, you **cannot** conclude $P$.
> - Writing $\forall x\ \text{Human}(x) \land \text{Mortal}(x)$ (says everything is a mortal human) instead of $\forall x\ \text{Human}(x) \Rightarrow \text{Mortal}(x)$.

## Interview questions

> [!INTERVIEW] Forward vs backward chaining?
> Forward chaining starts from facts and fires rules until the goal appears — good when many conclusions are wanted or data arrives continually. Backward chaining starts from the goal and works back to known facts — good for answering a specific query, and it only explores relevant rules.

> [!INTERVIEW] What is entailment?
> $KB \models \alpha$ means $\alpha$ is true in every model (possible world) in which the knowledge base is true.

> [!INTERVIEW] Why do we need first-order logic?
> Propositional logic has no variables or quantifiers, so general statements about all or some objects need huge numbers of separate symbols; FOL expresses them compactly with objects, predicates and quantifiers.

> [!REMEMBER]
> KB + inference · ¬ ∧ ∨ ⇒ ⇔ · entailment = true in all models of the KB · modus ponens, resolution · Horn clauses → forward (data-driven) / backward (goal-driven) chaining · FOL adds objects, predicates, ∀, ∃.
