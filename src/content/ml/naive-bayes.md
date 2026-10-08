**Naive Bayes** classifiers apply Bayes' theorem with one bold simplification: given the class, every feature is assumed to be **independent** of the others. The assumption is almost never exactly true, yet the classifier is fast, needs little data, and works remarkably well — especially for text such as spam filtering.

## Bayes' theorem for classification

For a class $c$ and features $\mathbf{x} = (x_1, \dots, x_d)$:

$$
P(c \mid \mathbf{x}) = \frac{P(\mathbf{x} \mid c)\, P(c)}{P(\mathbf{x})}
$$

- $P(c)$ — **prior**: how common the class is.
- $P(\mathbf{x} \mid c)$ — **likelihood**: how typical these features are for that class.
- $P(c \mid \mathbf{x})$ — **posterior**: what we want.
- $P(\mathbf{x})$ — the same for every class, so for choosing the winner we can ignore it and just normalise at the end.

The "naive" assumption factorises the likelihood into one term per feature:

$$
P(\mathbf{x} \mid c) = \prod_{j=1}^{d} P(x_j \mid c)
\qquad\Rightarrow\qquad
\hat{y} = \arg\max_c \; P(c)\prod_{j=1}^{d} P(x_j \mid c)
$$

In the lab, each class has one Gaussian per axis (top and right). For a new point, the model reads off $p(x_1 \mid c)$ and $p(x_2 \mid c)$ from those curves, multiplies them by the prior, and normalises.

> [!TIP] Why the naive assumption helps
> Estimating a full joint distribution over many features needs enormous amounts of data. Estimating $d$ one-dimensional distributions per class needs very little — that's why Naive Bayes trains in one pass and works with small datasets.

## Variants

| Variant | Feature type | $P(x_j \mid c)$ |
|---|---|---|
| **Gaussian NB** | continuous | normal distribution with per-class mean and variance |
| **Multinomial NB** | counts (word frequencies) | how often word $j$ appears in class $c$ documents |
| **Bernoulli NB** | binary (word present / absent) | probability the feature is 1 in class $c$ |
| **Complement NB** | counts, imbalanced text | estimated from the *other* classes; more stable |

## Gaussian NB from scratch

$$
P(x_j \mid c) = \frac{1}{\sqrt{2\pi\sigma_{c,j}^2}} \exp\!\left(-\frac{(x_j - \mu_{c,j})^2}{2\sigma_{c,j}^2}\right)
$$

```python
import numpy as np

def fit(X, y):
    classes = np.unique(y)
    mu = np.array([X[y == c].mean(axis=0) for c in classes])
    var = np.array([X[y == c].var(axis=0) for c in classes]) + 1e-9
    prior = np.array([np.mean(y == c) for c in classes])
    return classes, mu, var, prior

def predict_proba(model, x):
    classes, mu, var, prior = model
    # work in log space: sums instead of products avoid underflow
    log_like = -0.5 * np.sum(np.log(2 * np.pi * var) + (x - mu) ** 2 / var, axis=1)
    log_post = np.log(prior) + log_like
    p = np.exp(log_post - log_post.max())
    return p / p.sum()

X = np.array([[1.0, 2.1], [1.6, 1.5], [0.6, 2.6], [1.3, 2.4],
              [3.0, 0.9], [2.4, 1.4], [3.4, 0.6], [2.8, 1.2]])
y = np.array([0, 0, 0, 0, 1, 1, 1, 1])
model = fit(X, y)
print(np.round(predict_proba(model, np.array([1.1, 2.0])), 4))
print(np.round(predict_proba(model, np.array([2.1, 1.6])), 4))   # in between
```

```output
[1. 0.]
[0.3943 0.6057]
```

## Text classification with Multinomial NB

```python
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import make_pipeline

texts = ["win cash now", "limited offer win prize", "meeting at noon",
         "project meeting notes", "cheap prize offer", "lunch at noon tomorrow"]
labels = ["spam", "spam", "ham", "ham", "spam", "ham"]

clf = make_pipeline(CountVectorizer(), MultinomialNB(alpha=1.0))
clf.fit(texts, labels)
print(clf.predict(["win a cheap prize", "notes from the meeting"]))
```

```output
['spam' 'ham']
```

`alpha=1.0` is **Laplace (add-one) smoothing**: without it, a word never seen with a class would give that class probability exactly 0, wiping out all other evidence.

## Strengths and weaknesses

| ✅ Strengths | ⚠️ Weaknesses |
|---|---|
| extremely fast to train and predict | independence assumption ignores feature interactions |
| works with small data and many features (text) | probabilities are often over-confident (poorly calibrated) |
| handles multi-class naturally | Gaussian NB assumes bell-shaped features |
| robust to irrelevant features | zero-frequency problem without smoothing |

> [!WARNING]
> - Multiplying many small probabilities directly → numerical underflow to 0. Use **log-probabilities**.
> - Forgetting smoothing for unseen words.
> - Trusting the predicted probabilities as calibrated confidences; trust the ranking more than the values.
> - Feeding negative values (e.g. standardized features) to Multinomial NB, which expects counts.

## Interview questions

> [!INTERVIEW] Why is Naive Bayes called "naive"?
> Because it assumes all features are conditionally independent given the class, e.g. that the words "free" and "prize" occur independently in spam. This is rarely true but keeps the model simple and data-efficient.

> [!INTERVIEW] Why does it still work well despite the wrong assumption?
> Classification only needs the correct class to score highest, not accurate probabilities. Errors from the assumption often affect all classes similarly, so the argmax is still right.

> [!INTERVIEW] What is Laplace smoothing?
> Adding a small count (usually 1) to every feature–class count so that no probability is exactly zero. It prevents a single unseen word from eliminating a class.

> [!REMEMBER]
> Posterior ∝ prior × ∏ per-feature likelihoods · Gaussian / Multinomial / Bernoulli variants · use log-probs · Laplace smoothing · fast, great for text, probabilities over-confident.
