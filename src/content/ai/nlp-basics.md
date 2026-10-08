**Natural language processing (NLP)** teaches computers to work with human language: search, translation, spam filtering, sentiment analysis, chatbots. Every NLP system starts the same way — turning messy text into numbers a model can use. This page covers that pipeline, from tokens to word embeddings.

## The classic text pipeline

1. **Tokenization** — split text into units (words, sub-words or characters).
2. **Normalisation** — lowercase, strip punctuation, handle Unicode, expand contractions.
3. **Stop-word removal** (optional) — drop very common words like *the*, *is*, *and*.
4. **Stemming or lemmatization** — reduce words to a base form.
5. **Vectorisation** — represent text as numbers (bag-of-words, TF-IDF, embeddings).

> [!NOTE] Modern models skip most of this
> Transformer models use **sub-word tokenizers** (BPE, WordPiece, SentencePiece) and keep case, punctuation and stop words — they learn what matters. Steps 2–4 still matter for classical models and search engines.

## Tokenization

| Level | Example for "unhappiness" | Trade-off |
|---|---|---|
| Word | `unhappiness` | unseen words become "unknown" |
| Sub-word (BPE) | `un`, `happi`, `ness` | small vocabulary, handles new words — used by LLMs |
| Character | `u`, `n`, `h`, … | no unknowns, but long sequences |

## Stemming vs lemmatization

- **Stemming** chops suffixes by rules: *studies → studi*, *running → run*. Fast, crude, may not produce real words (Porter stemmer).
- **Lemmatization** uses vocabulary and grammar to find the dictionary form: *studies → study*, *better → good* (as an adjective). Slower, more accurate.

## Bag-of-words and TF-IDF

**Bag-of-words** represents a document by word counts, ignoring order. **TF-IDF** reweights counts so words that are frequent in *this* document but rare across the collection get high scores:

$$
\text{tf-idf}(t, d) = \text{tf}(t, d) \times \log\frac{N}{\text{df}(t)}
$$

where $N$ is the number of documents and $\text{df}(t)$ how many contain term $t$. (Libraries add smoothing, e.g. scikit-learn uses $\log\frac{1 + N}{1 + \text{df}} + 1$ and L2-normalises each row.)

```python
from sklearn.feature_extraction.text import TfidfVectorizer

docs = ["the cat sat on the mat",
        "the dog sat on the log",
        "cats and dogs are pets"]
vec = TfidfVectorizer()
X = vec.fit_transform(docs)
terms = vec.get_feature_names_out()
for i, doc in enumerate(docs):
    row = X[i].toarray()[0]
    top = sorted(zip(row, terms), reverse=True)[:3]
    print(f"{doc!r:28} -> {[(t, round(float(w), 2)) for w, t in top]}")
```

```output
'the cat sat on the mat'     -> [('the', 0.65), ('mat', 0.43), ('cat', 0.43)]
'the dog sat on the log'     -> [('the', 0.65), ('log', 0.43), ('dog', 0.43)]
'cats and dogs are pets'     -> [('pets', 0.45), ('dogs', 0.45), ('cats', 0.45)]
```

"the" still ranks first in the first two documents because it occurs twice in each (high term frequency), but its IDF is lower than that of "cat" or "mat", which appear in only one document; across a large collection, words like "the" sink toward zero weight. Words unique to a document ("pets") get the highest IDF. Limitations: no word order, no meaning — "cat" and "kitten" are as unrelated as "cat" and "car", and vectors are huge and sparse.

## Word embeddings

**Embeddings** map each word to a dense vector (typically 100–1,000 dimensions) so that words used in similar contexts get similar vectors — the **distributional hypothesis** ("you shall know a word by the company it keeps"). Similarity is measured with **cosine similarity**:

$$
\cos(\mathbf{a}, \mathbf{b}) = \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\,\lVert\mathbf{b}\rVert}
$$

Directions in the space can carry meaning — the famous analogy *king − man + woman ≈ queen*. The lab uses hand-made **2-D toy vectors** to show the idea; real embeddings are learned and high-dimensional, and analogies hold only approximately.

```python
import numpy as np

# toy 4-D vectors: [royalty, male, female, fruit]
emb = {"king": [0.9, 0.8, 0.1, 0.0], "queen": [0.9, 0.1, 0.8, 0.0],
       "man": [0.2, 0.9, 0.1, 0.0], "woman": [0.2, 0.1, 0.9, 0.0],
       "apple": [0.0, 0.1, 0.1, 0.9]}
emb = {w: np.array(v) for w, v in emb.items()}

def cosine(a, b):
    return a @ b / (np.linalg.norm(a) * np.linalg.norm(b))

target = emb["king"] - emb["man"] + emb["woman"]
ranked = sorted((w for w in emb if w not in {"king", "man", "woman"}),
                key=lambda w: cosine(emb[w], target), reverse=True)
print("king - man + woman ->", ranked[0])
print(f"cos(king, queen) = {cosine(emb['king'], emb['queen']):.2f}, "
      f"cos(king, apple) = {cosine(emb['king'], emb['apple']):.2f}")
```

```output
king - man + woman -> queen
cos(king, queen) = 0.66, cos(king, apple) = 0.08
```

| Method | Idea |
|---|---|
| **Word2Vec** (2013) | predict a word from its context (CBOW) or the context from a word (skip-gram) |
| **GloVe** (2014) | factorise global word co-occurrence statistics |
| **fastText** (2016) | sums sub-word (character n-gram) vectors — handles rare and misspelled words |
| **Contextual embeddings** (ELMo, BERT, GPT) | a word's vector depends on its sentence — "bank" of a river vs a bank account |

Static embeddings give one vector per word regardless of context; contextual ones come from [transformers](/ai/transformers-attention).

## Common NLP tasks

Text classification (spam, sentiment) · named entity recognition · part-of-speech tagging · machine translation · question answering · summarisation · information retrieval / semantic search · text generation.

> [!WARNING]
> - Fitting the TF-IDF vocabulary on test data (leakage) — fit on the training set.
> - Removing stop words for tasks where they matter ("not good" → "good").
> - Treating toy analogy demos as proof embeddings "understand" meaning.
> - Embeddings inherit **biases** from their training text (e.g. gender stereotypes) — see [AI Ethics](/ai/ai-ethics).

## Interview questions

> [!INTERVIEW] Stemming vs lemmatization?
> Stemming strips affixes with heuristic rules and may produce non-words; lemmatization uses a vocabulary and part of speech to return the proper dictionary form. Lemmatization is more accurate but slower.

> [!INTERVIEW] What is TF-IDF and why use it over raw counts?
> Term frequency × inverse document frequency: it up-weights words that are distinctive for a document and down-weights words common across all documents, which raw counts treat as important.

> [!INTERVIEW] What problem do word embeddings solve?
> One-hot / bag-of-words vectors are sparse and treat all words as equally different. Embeddings are dense and place semantically similar words close together, so models generalise across related words.

> [!REMEMBER]
> Tokenize → normalise → (stop words, stem/lemmatize) → vectorise · BoW & TF-IDF (sparse, no order) · embeddings (dense, similar words close, cosine similarity) · Word2Vec/GloVe static, BERT/GPT contextual · sub-word tokens for LLMs.
