An **agent** is anything that **perceives** its environment through sensors and **acts** on it through actuators. A thermostat, a vacuum robot, a self-driving car and a chess program are all agents. AI, in the modern view, is the study of designing **rational agents** — agents that do the right thing given what they know.

## Agents and environments

```diagram The agent–environment loop
          percepts
   ┌──────────────────────┐
   │                      ▼
Environment            Agent  (sensors → agent program → actuators)
   ▲                      │
   └──────────────────────┘
           actions
```

- **Percept** — what the agent senses at one moment; the **percept sequence** is everything it has ever sensed.
- **Agent function** — maps percept sequences to actions (the abstract behaviour).
- **Agent program** — the actual code implementing that function on the agent's hardware.

The lab's vacuum world (two squares, A and B, each clean or dirty) is the textbook example: the percept is `(location, status)` and the actions are `Left`, `Right` and `Suck`.

## Rationality

A **rational agent** chooses the action expected to maximise its **performance measure**, given its percept sequence and built-in knowledge. Rational ≠ omniscient (it can't know what it hasn't perceived) and ≠ perfect (outcomes can be unlucky). The performance measure should reflect what we want *in the environment* — e.g. "clean squares over time", not "amount of dirt sucked" (which a robot could game by dumping and re-sucking dirt).

## PEAS — specifying a task

| | Self-driving taxi | Vacuum robot |
|---|---|---|
| **P**erformance | safe, fast, legal, comfortable, profitable | clean squares per time step, energy used |
| **E**nvironment | roads, traffic, pedestrians, weather | rooms, dirt, furniture |
| **A**ctuators | steering, accelerator, brake, horn, display | wheels, brushes, suction |
| **S**ensors | cameras, lidar, radar, GPS, speedometer | dirt sensor, bump sensor, location |

## Properties of environments

| Property | Easy end | Hard end |
|---|---|---|
| Observability | **fully observable** (chess) | **partially observable** (poker, driving) |
| Agents | single-agent (crossword) | **multi-agent**: competitive (chess) or cooperative |
| Outcome of actions | **deterministic** | **stochastic** (dice, slippery floors) |
| Episodes | **episodic** (classify each image independently) | **sequential** (each move affects the future) |
| Change while thinking | **static** | **dynamic** (traffic) |
| States / time / actions | **discrete** | **continuous** |
| Rules | **known** | **unknown** (must be learned) |

The real world is the hardest case on every axis: partially observable, multi-agent, stochastic, sequential, dynamic, continuous.

## Five agent architectures

1. **Simple reflex agent** — acts on the current percept with condition–action rules. Works only when the right action depends on the current percept alone (fully observable). The lab's vacuum agent is one.
2. **Model-based reflex agent** — keeps an **internal state** (a model of how the world evolves and how actions affect it) to handle partial observability.
3. **Goal-based agent** — considers which actions lead to a **goal**; uses search and planning.
4. **Utility-based agent** — goals aren't enough when there are trade-offs; a **utility function** scores how desirable each state is, and the agent maximises expected utility.
5. **Learning agent** — any of the above plus a **learning element** that improves performance from feedback (a critic), and a problem generator that suggests exploratory actions.

```python
def reflex_vacuum_agent(percept):
    location, status = percept
    if status == "Dirty":
        return "Suck"
    return "Right" if location == "A" else "Left"

class ModelBasedVacuumAgent:
    """Remembers which squares it has seen clean, and stops when both are."""
    def __init__(self):
        self.known_clean = set()

    def act(self, percept):
        location, status = percept
        if status == "Dirty":
            return "Suck"
        self.known_clean.add(location)
        if self.known_clean == {"A", "B"}:
            return "NoOp"                     # internal state lets it stop
        return "Right" if location == "A" else "Left"

agent = ModelBasedVacuumAgent()
for percept in [("A", "Dirty"), ("A", "Clean"), ("B", "Clean")]:
    print(percept, "->", reflex_vacuum_agent(percept), "|", agent.act(percept))
```

```output
('A', 'Dirty') -> Suck | Suck
('A', 'Clean') -> Right | Right
('B', 'Clean') -> Left | NoOp
```

The reflex agent shuttles back and forth forever; the model-based one knows when the job is done.

> [!WARNING]
> - Designing a performance measure the agent can game (reward what you want achieved, not how).
> - Using a simple reflex agent in a partially observable environment (it can loop forever).
> - Confusing the agent function (mathematical mapping) with the agent program (implementation).

## Interview questions

> [!INTERVIEW] What is PEAS?
> Performance measure, Environment, Actuators, Sensors — a checklist for specifying an agent's task before designing it.

> [!INTERVIEW] Simple reflex vs model-based reflex agent?
> A simple reflex agent maps the current percept straight to an action. A model-based agent keeps internal state about parts of the world it can't currently see, so it can act sensibly under partial observability.

> [!INTERVIEW] Goal-based vs utility-based agent?
> Goals are binary (achieved or not); utility measures *how* good a state is, letting the agent trade off speed, safety and cost, and act under uncertainty by maximising expected utility.

> [!REMEMBER]
> Agent = sensors → program → actuators · rational = maximise expected performance · PEAS · environment properties (observable, deterministic, episodic, static, discrete, single-agent) · reflex → model-based → goal → utility → learning.
