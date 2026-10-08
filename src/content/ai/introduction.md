**Artificial intelligence (AI)** is the field of building machines that perform tasks we associate with intelligence — reasoning, planning, learning, understanding language, perceiving the world. It is a broad umbrella: a chess engine searching millions of moves, a spam filter learning from examples and a chatbot generating text are all AI, built in very different ways.

## AI, ML, deep learning, generative AI

The lab's rings show how the terms nest:

| Term | What it is | Example |
|---|---|---|
| **Artificial intelligence** | any technique that makes machines act intelligently, including hand-written rules and search | route planning, chess engines, expert systems |
| **Machine learning** | AI that **learns** behaviour from data instead of explicit rules | spam filters, recommendation systems |
| **Deep learning** | ML with many-layered **neural networks** | image recognition, speech recognition |
| **Generative AI** | deep-learning models that **create** new content | LLM chatbots, image generators |

Not all AI is machine learning: Deep Blue (1997) beat Garry Kasparov with search and hand-tuned evaluation, not learning. See [What is Machine Learning?](/ml/introduction) for the ML side.

## Four ways to define AI

Russell & Norvig organise definitions along two axes — thinking vs acting, and humanly vs rationally:

| | Humanly | Rationally |
|---|---|---|
| **Thinking** | cognitive modelling — think like people | "laws of thought" — logic |
| **Acting** | the **Turing test** — behave like people | **rational agents** — act to achieve the best expected outcome |

Modern AI mostly follows the **rational agent** view: build agents that choose actions maximising a performance measure. See [Intelligent Agents](/ai/intelligent-agents).

## The Turing test

Alan Turing (1950) proposed the *imitation game*: a human judge chats in text with a machine and a person; if the judge can't reliably tell which is which, the machine is said to pass. It sidesteps "can machines think?" in favour of observable behaviour. Critics note it measures imitation rather than understanding — Searle's *Chinese Room* argument is the famous objection.

## Narrow, general and super intelligence

- **Narrow (weak) AI** — excellent at specific tasks (translation, Go, face recognition). All AI deployed today is narrow, even when it is very capable across many tasks.
- **Artificial general intelligence (AGI)** — human-level competence across essentially any intellectual task. A research goal; its timeline and even its definition are debated.
- **Superintelligence** — hypothetical intelligence far exceeding humans'.

## Approaches through history

| Approach | Idea | Strength / weakness |
|---|---|---|
| **Symbolic AI** ("GOFAI") | logic, rules, search over explicit symbols | transparent; brittle, hard to scale knowledge by hand |
| **Expert systems** (1970s–80s) | if–then rules from human experts | worked in narrow domains; expensive to maintain |
| **Statistical ML** (1990s–) | learn patterns from data | robust; needs data and features |
| **Deep learning** (2012–) | learn features *and* patterns end to end | state of the art in perception and language; data- and compute-hungry, less interpretable |

Periods of over-promising were followed by funding cuts known as **AI winters** (mid-1970s and late 1980s–early 1990s).

## A short timeline

The lab steps through these milestones:

- **1950** — Turing's paper *Computing Machinery and Intelligence* proposes the imitation game.
- **1956** — the Dartmouth workshop names the field "artificial intelligence".
- **1958** — Rosenblatt's perceptron, an early learning machine.
- **1966** — ELIZA, one of the first chatbots.
- **1986** — backpropagation popularised for training multi-layer networks.
- **1997** — Deep Blue defeats world chess champion Garry Kasparov.
- **2012** — AlexNet wins ImageNet, starting the deep-learning boom.
- **2016** — AlphaGo defeats Lee Sedol at Go.
- **2017** — *Attention Is All You Need* introduces the Transformer.
- **2022** — ChatGPT brings large language models to the public.

## Major subfields

Search and planning · knowledge representation and reasoning · machine learning · natural language processing · computer vision · robotics · multi-agent systems · speech.

> [!WARNING]
> - Using "AI" and "machine learning" as synonyms in an interview — ML is a subset.
> - Claiming today's systems are AGI or "understand" like humans — be precise about what they do.
> - Forgetting classical AI (search, logic, planning); it is still everywhere: GPS routing, games, schedulers, compilers.

## Interview questions

> [!INTERVIEW] What is the difference between AI, ML and deep learning?
> AI is the goal of intelligent behaviour by machines (by any method). ML is the subset that learns from data. Deep learning is the subset of ML using multi-layer neural networks.

> [!INTERVIEW] What is the Turing test and what is its main criticism?
> A judge converses in text with a human and a machine; the machine passes if the judge can't tell them apart. Criticism: it tests convincing imitation of human behaviour, not intelligence or understanding (e.g. Searle's Chinese Room).

> [!INTERVIEW] What is a rational agent?
> An agent that, for each sequence of percepts, chooses the action expected to maximise its performance measure, given its knowledge.

> [!REMEMBER]
> AI ⊃ ML ⊃ DL ⊃ GenAI · four definitions (think/act × human/rational) · modern AI = rational agents · all deployed AI is narrow · symbolic → statistical → deep learning.
