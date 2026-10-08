Real agents rarely know things for certain: sensors are noisy, tests give false positives, the world is partly hidden. **Probabilistic reasoning** represents beliefs as probabilities and updates them correctly as evidence arrives — with **Bayes' theorem** at its heart.

## Probability essentials

- $P(A)$ — probability of $A$, between 0 and 1.
- **Joint** $P(A, B)$ — both happen. **Conditional** $P(A \mid B) = \dfrac{P(A, B)}{P(B)}$ — $A$ given that $B$ happened.
- **Product rule**: $P(A, B) = P(A \mid B)\,P(B)$.
- **Total probability**: $P(B) = \sum_i P(B \mid A_i)\,P(A_i)$ over mutually exclusive, exhaustive $A_i$.
- **Independence**: $P(A, B) = P(A)\,P(B)$. **Conditional independence**: $P(A, B \mid C) = P(A \mid C)\,P(B \mid C)$.

## Bayes' theorem

$$
P(H \mid E) = \frac{P(E \mid H)\, P(H)}{P(E)}
$$

| Term | Name | Meaning |
|---|---|---|
| $P(H)$ | **prior** | belief in the hypothesis before the evidence |
| $P(E \mid H)$ | **likelihood** | how probable the evidence is if $H$ is true |
| $P(E)$ | **evidence** | overall probability of the evidence (normaliser) |
| $P(H \mid E)$ | **posterior** | updated belief after seeing the evidence |

## The medical-test example (the lab)

A disease affects **1%** of people. A test has **95% sensitivity** ($P(+ \mid D)$) and **90% specificity** ($P(- \mid \neg D)$). You test positive. How likely is it that you're sick?

$$
P(D \mid +) = \frac{0.95 \times 0.01}{0.95 \times 0.01 + 0.10 \times 0.99} = \frac{0.0095}{0.1085} \approx 0.088
$$

Only about **9%**. Out of 1,000 people: about 10 are sick and ~9–10 of them test positive, but ~99 of the 990 healthy people also test positive. Positives are dominated by false alarms because healthy people vastly outnumber sick ones. Ignoring the prior like this is the **base-rate fallacy**. Move the lab's prevalence slider up and watch the posterior climb.

```python
def posterior(prior, sensitivity, specificity):
    p_pos = sensitivity * prior + (1 - specificity) * (1 - prior)   # total probability
    return sensitivity * prior / p_pos

print(f"1 positive test:  {posterior(0.01, 0.95, 0.90):.3f}")
# a second, independent positive test: yesterday's posterior is today's prior
p1 = posterior(0.01, 0.95, 0.90)
print(f"2 positive tests: {posterior(p1, 0.95, 0.90):.3f}")
print(f"prevalence 20%:   {posterior(0.20, 0.95, 0.90):.3f}")
```

```output
1 positive test:  0.088
2 positive tests: 0.477
prevalence 20%:   0.704
```

**Bayesian updating** chains naturally: the posterior after one piece of evidence becomes the prior for the next (assuming the pieces of evidence are conditionally independent given the hypothesis).

## Bayesian networks

A full joint distribution over $n$ binary variables needs $2^n - 1$ numbers — impossible for large $n$. A **Bayesian network** is a directed acyclic graph where each node is a variable, arrows encode direct influence, and each node stores $P(\text{node} \mid \text{parents})$. The joint distribution factorises:

$$
P(X_1, \dots, X_n) = \prod_{i=1}^{n} P\big(X_i \mid \text{Parents}(X_i)\big)
$$

```diagram The classic burglary network: either cause can trigger the alarm
  Burglary      Earthquake
        ╲         ╱
         ▼       ▼
           Alarm
         ╱       ╲
        ▼         ▼
  JohnCalls     MaryCalls
```

Five binary variables need $2^5 - 1 = 31$ joint numbers, but the network needs only $1 + 1 + 4 + 2 + 2 = 10$ conditional probabilities. Each node is conditionally independent of its non-descendants given its parents.

**Inference** asks things like $P(\text{Burglary} \mid \text{JohnCalls}, \text{MaryCalls})$: exact methods (enumeration, variable elimination) or approximate ones (sampling, e.g. likelihood weighting, Gibbs sampling) for large networks.

**Explaining away**: if the alarm rang and you learn there was an earthquake, the probability of a burglary *drops* — two causes of one effect become dependent once the effect is observed.

## Related models

- **Naive Bayes** — a Bayesian network with the class as the only parent of every feature ([Naive Bayes](/ml/naive-bayes)).
- **Hidden Markov models** — hidden states evolving over time with noisy observations (speech, tagging).
- **Kalman filters** — continuous-state tracking (GPS, robot localisation).
- **Markov decision processes** — probability plus decisions ([MDPs](/ai/mdp)).

> [!WARNING]
> - Confusing $P(+ \mid D)$ with $P(D \mid +)$ (the prosecutor's fallacy).
> - Ignoring base rates.
> - Multiplying probabilities of events that aren't independent.
> - Reading arrows in a Bayesian network as guaranteed causation — they encode conditional dependence (causal direction makes networks compact, but data alone doesn't prove it).

## Interview questions

> [!INTERVIEW] State Bayes' theorem and explain each term.
> $P(H \mid E) = P(E \mid H)P(H)/P(E)$: the posterior equals likelihood × prior, normalised by the evidence probability.

> [!INTERVIEW] A test is 99% accurate for a disease affecting 1 in 10,000. A positive result — likely sick?
> No. With 99% sensitivity and 99% specificity: $P(D \mid +) = \frac{0.99 \times 0.0001}{0.99 \times 0.0001 + 0.01 \times 0.9999} \approx 1\%$. False positives from the huge healthy population dominate.

> [!INTERVIEW] Why use a Bayesian network instead of a full joint table?
> It exploits conditional independence so you only store each variable's distribution given its parents — exponentially fewer numbers, easier to specify and faster inference.

> [!REMEMBER]
> Posterior ∝ likelihood × prior · total probability for the denominator · base rates matter · today's posterior = tomorrow's prior · Bayesian network: joint = ∏ P(node | parents) · explaining away.
