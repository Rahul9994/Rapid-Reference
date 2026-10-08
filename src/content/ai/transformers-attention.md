The **Transformer** (Vaswani et al., *Attention Is All You Need*, 2017) is the architecture behind modern language models — GPT, BERT, Claude, Gemini — and increasingly vision and audio models too. Its core idea, **self-attention**, lets every token look at every other token and decide which ones matter for understanding it.

## Why attention?

Earlier sequence models (RNNs, LSTMs) read text one token at a time, squeezing everything so far into a single hidden state. That made them slow to train (no parallelism across positions) and forgetful over long distances. Self-attention connects every pair of positions **directly** and processes all positions **in parallel**.

In *"The animal didn't cross the street because it was too tired"*, what does **it** refer to? Attention lets the representation of "it" draw heavily on "animal" — exactly what the lab shows (with illustrative toy vectors).

## Queries, keys and values

Each token's embedding $\mathbf{x}$ is projected into three vectors with learned matrices:

- **Query** $\mathbf{q} = \mathbf{x}W_Q$ — "what am I looking for?"
- **Key** $\mathbf{k} = \mathbf{x}W_K$ — "what do I contain?"
- **Value** $\mathbf{v} = \mathbf{x}W_V$ — "what do I pass on if you attend to me?"

Like a soft dictionary lookup: compare a query with every key, and return a weighted blend of the values.

## Scaled dot-product attention

$$
\text{Attention}(Q, K, V) = \text{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

1. $QK^\top$ — a score for every (query, key) pair: an $n \times n$ matrix (the lab's heatmap).
2. Divide by $\sqrt{d_k}$ — keeps scores from growing with dimension, which would push softmax into regions with tiny gradients.
3. **Softmax** each row — weights that are positive and sum to 1.
4. Multiply by $V$ — each output is a weighted average of value vectors.

```python
import numpy as np

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

def attention(Q, K, V, mask=None):
    scores = Q @ K.T / np.sqrt(K.shape[-1])
    if mask is not None:
        scores = np.where(mask, scores, -np.inf)     # hide disallowed positions
    weights = softmax(scores)
    return weights @ V, weights

rng = np.random.default_rng(0)
n, d = 4, 8                                         # 4 tokens, 8-dim model
X = rng.normal(size=(n, d))
Wq, Wk, Wv = (rng.normal(size=(d, d)) / np.sqrt(d) for _ in range(3))
out, w = attention(X @ Wq, X @ Wk, X @ Wv)
print("output shape:", out.shape)
print("each row of weights sums to 1:", np.allclose(w.sum(axis=1), 1))

causal = np.tril(np.ones((n, n), dtype=bool))       # GPT-style: no peeking ahead
_, w_causal = attention(X @ Wq, X @ Wk, X @ Wv, mask=causal)
print(np.round(w_causal, 2))
```

```output
output shape: (4, 8)
each row of weights sums to 1: True
[[1.   0.   0.   0.  ]
 [1.   0.   0.   0.  ]
 [0.31 0.34 0.35 0.  ]
 [0.22 0.28 0.21 0.29]]
```

The **causal mask** zeroes attention to future tokens — every row only uses positions up to itself, which is what lets GPT-style models generate text left to right.

## Multi-head attention

One attention pattern can't capture everything (syntax, coreference, position…). **Multi-head attention** runs $h$ attention operations in parallel, each with its own smaller $W_Q, W_K, W_V$, concatenates the results and mixes them with an output projection $W_O$. Different heads learn to track different relationships.

## The Transformer block

```diagram One decoder-style block (stacked N times)
 x ─► LayerNorm ─► Multi-head self-attention ─► + ─► LayerNorm ─► Feed-forward MLP ─► + ─► out
 └────────────── residual ───────────────────┘ └──────────── residual ────────────┘
```

- **Residual connections** and **layer normalisation** make deep stacks trainable.
- A position-wise **feed-forward network** (two linear layers with an activation) follows attention.
- **Positional encoding**: attention itself ignores order, so position information is added — sinusoidal encodings in the original paper; learned or rotary (RoPE) embeddings in many modern models.

## Encoder, decoder, or both

| Type | Attention | Examples | Good at |
|---|---|---|---|
| **Encoder-only** | bidirectional (sees the whole input) | BERT | classification, embeddings, search |
| **Decoder-only** | causal (left-to-right) | GPT family, most chat LLMs | text generation |
| **Encoder–decoder** | encoder + cross-attention from decoder | original Transformer, T5 | translation, summarisation |

## Cost

Self-attention is $O(n^2 \cdot d)$ in sequence length $n$ — every token attends to every token. Long contexts are expensive, which motivates efficient attention variants (sparse/sliding-window attention, FlashAttention's memory-efficient computation) and KV caching during generation.

> [!WARNING]
> - Forgetting the $\sqrt{d_k}$ scaling.
> - Applying softmax over the wrong axis (it is over keys, per query row).
> - Assuming attention weights are a faithful *explanation* of a model's decision — they are one internal signal, not proof of reasoning.
> - Thinking transformers understand word order without positional information.

## Interview questions

> [!INTERVIEW] Explain self-attention.
> Each token produces a query, key and value. A token's output is a weighted average of all tokens' values, with weights = softmax of its query's dot products with every key, scaled by $\sqrt{d_k}$. It lets each position gather context from anywhere in the sequence in one step.

> [!INTERVIEW] Why scale by $\sqrt{d_k}$?
> Dot products of random $d_k$-dimensional vectors have variance proportional to $d_k$; large scores saturate the softmax and shrink gradients. Dividing by $\sqrt{d_k}$ keeps the variance around 1.

> [!INTERVIEW] Why did transformers replace RNNs?
> They process all positions in parallel (fast training on GPUs), connect distant tokens directly (better long-range dependencies), and scale smoothly to huge models and datasets.

> [!REMEMBER]
> Q·Kᵀ/√dₖ → softmax → ×V · multi-head · residual + LayerNorm + FFN · positional encoding · encoder (BERT) / decoder (GPT) / both (T5) · causal mask for generation · $O(n^2)$ in length.
