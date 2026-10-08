**Large language models (LLMs)** are transformer networks with billions of parameters trained on huge amounts of text to do one deceptively simple thing: **predict the next token**. Repeating that prediction — and sampling from it — produces essays, code and conversations. **Generative AI** more broadly covers models that create new content: text, images, audio, video and code.

## Next-token prediction

Given a context, the model outputs a score (**logit**) for every token in its vocabulary; softmax turns those into a probability distribution; one token is chosen, appended, and the process repeats — **autoregressive** generation. The lab does exactly this with a tiny hand-written "model":

$$
P(x_t \mid x_1, \dots, x_{t-1}) = \text{softmax}(\mathbf{z}_t)
$$

The model has no separate lookup of facts: knowledge is stored implicitly in its parameters, learned from patterns in the training data.

## How LLMs are built

1. **Pre-training** — self-supervised next-token prediction over a very large text corpus. The model learns grammar, facts, style and some reasoning patterns. This is by far the most compute-intensive stage.
2. **Supervised fine-tuning (SFT / instruction tuning)** — train on curated prompt → ideal-response examples so the model follows instructions and holds conversations.
3. **Preference tuning** — align outputs with what people find helpful and harmless:
   - **RLHF**: humans rank responses → train a **reward model** → optimise the LLM against it with reinforcement learning (e.g. PPO).
   - **DPO** and related methods optimise directly on preference pairs without a separate RL loop.
   - Constitutional / AI-feedback approaches use written principles and model-generated critiques.

## Decoding: how the next token is chosen

| Strategy | How | Effect |
|---|---|---|
| **Greedy** | always the most probable token | deterministic; can be repetitive |
| **Temperature $T$** | sample from $\text{softmax}(\mathbf{z}/T)$ | $T < 1$ sharper/safer, $T > 1$ flatter/more creative, $T \to 0$ ≈ greedy |
| **Top-k** | sample only among the $k$ most likely tokens | cuts off the long tail |
| **Top-p (nucleus)** | sample from the smallest set whose cumulative probability ≥ $p$ | adapts the cutoff to how confident the model is |
| **Beam search** | keep the $b$ best partial sequences | common in translation, less in chat |

```python
import numpy as np

tokens = [" Paris", " a", " the", " located", " Lyon", " Berlin"]
logits = np.array([6.0, 3.4, 3.0, 2.5, 1.0, -0.6])      # toy scores for "The capital of France is"

def probs(logits, T=1.0, top_p=1.0):
    p = np.exp((logits - logits.max()) / T)
    p /= p.sum()
    order = np.argsort(p)[::-1]
    before = np.cumsum(p[order]) - p[order]
    keep = order[before < top_p]                          # nucleus: smallest set reaching top_p
    q = np.zeros_like(p)
    q[keep] = p[keep]
    return q / q.sum()

for T, top_p in [(0.5, 1.0), (1.0, 1.0), (2.0, 1.0), (1.0, 0.9)]:
    p = probs(logits, T, top_p)
    print(f"T={T}, top_p={top_p}: " + "  ".join(f"{t.strip()}={v:.2f}" for t, v in zip(tokens, p)))
```

```output
T=0.5, top_p=1.0: Paris=0.99  a=0.01  the=0.00  located=0.00  Lyon=0.00  Berlin=0.00
T=1.0, top_p=1.0: Paris=0.86  a=0.06  the=0.04  located=0.03  Lyon=0.01  Berlin=0.00
T=2.0, top_p=1.0: Paris=0.56  a=0.15  the=0.12  located=0.10  Lyon=0.05  Berlin=0.02
T=1.0, top_p=0.9: Paris=0.93  a=0.07  the=0.00  located=0.00  Lyon=0.00  Berlin=0.00
```

At $T = 2$ the wrong answers "Lyon" (5%) and "Berlin" (2%) get a real chance, while top-p = 0.9 removes them entirely — sampling a wrong-but-fluent token is one route to **hallucination**.

## Key concepts

| Concept | Meaning |
|---|---|
| **Token** | a sub-word unit; roughly ¾ of an English word on average |
| **Context window** | the maximum number of tokens the model can attend to at once |
| **Prompt engineering** | clear instructions, examples (**few-shot**), roles, and asking for step-by-step reasoning |
| **Zero-/few-shot learning** | doing a task from instructions alone, or from a handful of examples in the prompt — no weight updates |
| **Hallucination** | confident output that is false or unsupported |
| **RAG** | retrieval-augmented generation: search a knowledge base and put relevant passages in the prompt so answers are grounded and citable |
| **Fine-tuning / LoRA** | adapting weights to a domain; LoRA trains small low-rank adapter matrices instead of all weights |
| **Embeddings** | vectors for semantic search, clustering and RAG retrieval |
| **Agents / tool use** | the model calls tools (search, code, APIs) and acts in loops |

## Why LLMs hallucinate

They are trained to produce *plausible continuations*, not verified truth; their knowledge has a cutoff date; rare facts are weakly encoded; and sampling can pick low-probability tokens. Mitigations: RAG with sources, lower temperature for factual tasks, asking the model to say when it doesn't know, tool use (calculators, search), and human or automated verification.

## Other generative models

- **Diffusion models** (image generators) learn to reverse a gradual noising process, turning noise into images step by step.
- **GANs** pit a generator against a discriminator.
- **VAEs** learn a latent space to sample from.
- **Multimodal models** combine text with images, audio or video.

> [!WARNING]
> - Treating LLM output as a source of truth — verify facts and code.
> - Pasting secrets or personal data into third-party tools.
> - Confusing "context window" with "memory" — nothing outside the context is seen unless retrieved.
> - Assuming a high benchmark score means reliability on your task — evaluate on your own data.

## Interview questions

> [!INTERVIEW] How does an LLM generate text?
> It repeatedly predicts a probability distribution over the next token given all previous tokens, chooses one (greedy or sampling with temperature/top-k/top-p), appends it, and continues until a stop condition.

> [!INTERVIEW] What does temperature do?
> It divides the logits before softmax: low temperature sharpens the distribution (more deterministic), high temperature flattens it (more diverse, more errors).

> [!INTERVIEW] What is RAG and why use it?
> Retrieval-augmented generation retrieves relevant documents (usually via embedding search) and includes them in the prompt, grounding answers in up-to-date, citable sources and reducing hallucinations without retraining.

> [!REMEMBER]
> Next-token prediction, autoregressive · pre-train → SFT → RLHF/DPO · temperature, top-k, top-p · context window · hallucination → RAG, tools, verification · diffusion/GANs/VAEs for other media.
