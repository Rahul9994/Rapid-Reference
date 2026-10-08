**K-nearest neighbours (KNN)** classifies a new point by looking at the $k$ training points closest to it and taking a majority vote (or, for regression, an average). There is no training step at all — the model *is* the stored dataset. Click anywhere in the lab to drop a query point and watch the vote.

## The algorithm

To predict for a query $\mathbf{x}$:

1. Compute the distance from $\mathbf{x}$ to every training point.
2. Take the $k$ nearest.
3. **Classification**: return the most common label among them (optionally weighting closer neighbours more). **Regression**: return their mean (or distance-weighted mean).

```python
import numpy as np
from collections import Counter

def knn_predict(X_train, y_train, x, k=5):
    dists = np.sqrt(((X_train - x) ** 2).sum(axis=1))   # Euclidean
    nearest = np.argsort(dists)[:k]
    return Counter(y_train[nearest]).most_common(1)[0][0]

X_train = np.array([[1, 1], [1, 2], [2, 1], [6, 6], [6, 7], [7, 6]])
y_train = np.array(["red", "red", "red", "blue", "blue", "blue"])
print(knn_predict(X_train, y_train, np.array([2, 2]), k=3))
print(knn_predict(X_train, y_train, np.array([5, 5]), k=3))
```

```output
red
blue
```

## Distance metrics

| Metric | Formula | Notes |
|---|---|---|
| Euclidean ($L_2$) | $\sqrt{\sum_j (a_j - b_j)^2}$ | default; straight-line distance |
| Manhattan ($L_1$) | $\sum_j \lvert a_j - b_j \rvert$ | grid-like movement, a bit more robust to outliers |
| Minkowski | $\left(\sum_j \lvert a_j - b_j \rvert^p\right)^{1/p}$ | $p=1$ Manhattan, $p=2$ Euclidean |
| Cosine distance | $1 - \frac{\mathbf{a}\cdot\mathbf{b}}{\lVert\mathbf{a}\rVert\lVert\mathbf{b}\rVert}$ | direction only — common for text and embeddings |
| Hamming | number of differing positions | categorical / binary features |

> [!IMPORTANT] Scale your features
> Distances add up differences across features, so a feature measured in thousands drowns one measured in single digits. Standardize first — the [Data Preprocessing](/ml/data-preprocessing) lab shows a query's nearest neighbour changing after scaling.

## Choosing k

- **Small $k$** (e.g. 1): very flexible, jagged boundaries, sensitive to noise → **high variance**.
- **Large $k$**: smooth boundaries, but can blur real structure → **high bias**. With $k = n$ it always predicts the majority class.
- For binary problems, an odd $k$ avoids ties.
- Pick $k$ with cross-validation. Drag the slider in the lab and watch the coloured regions smooth out.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import cross_val_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_iris(return_X_y=True)
for k in [1, 5, 15, 50]:
    model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=k))
    score = cross_val_score(model, X, y, cv=5).mean()
    print(f"k = {k:2d}: CV accuracy {score:.3f}")
```

```output
k =  1: CV accuracy 0.947
k =  5: CV accuracy 0.960
k = 15: CV accuracy 0.940
k = 50: CV accuracy 0.873
```

## Complexity

| | Cost |
|---|---|
| Training | $O(1)$ — just store the data ("lazy learner") |
| Prediction (brute force) | $O(n \cdot d)$ per query |
| Memory | $O(n \cdot d)$ — the whole training set |

KD-trees and ball trees speed up search in low dimensions; approximate nearest-neighbour indexes (HNSW, FAISS) are used for large-scale embedding search.

## The curse of dimensionality

In high dimensions, points become roughly **equidistant**: the nearest and farthest neighbours are almost the same distance away, so "nearest" stops meaning "similar". KNN works best with a modest number of informative features — reduce dimensions first ([PCA](/ml/pca)) or select features.

## Strengths and weaknesses

| ✅ Strengths | ⚠️ Weaknesses |
|---|---|
| no training, trivially updated with new data | slow, memory-heavy predictions |
| naturally multi-class, non-linear boundaries | needs scaling and a good distance metric |
| few assumptions about the data | suffers in high dimensions and with irrelevant features |
| easy to explain ("these 5 similar cases…") | sensitive to class imbalance (the majority class wins votes) |

> [!WARNING]
> - Forgetting to scale features.
> - Choosing $k$ on the test set.
> - Using even $k$ for binary classification without a tie-breaking rule.
> - Including the query point itself when evaluating on training data (it is always its own nearest neighbour, so $k = 1$ looks perfect).

## Interview questions

> [!INTERVIEW] Is KNN parametric or non-parametric? Lazy or eager?
> Non-parametric (the "model" grows with the data) and lazy (no work at training time; all computation happens at prediction).

> [!INTERVIEW] How does $k$ affect bias and variance?
> Small $k$ → low bias, high variance (overfits noise). Large $k$ → high bias, low variance (over-smooths).

> [!INTERVIEW] Why is KNN slow at prediction and how would you speed it up?
> Brute force compares the query with all $n$ points. Use KD-trees / ball trees for low dimensions, approximate nearest-neighbour libraries for large or high-dimensional data, or reduce dimensionality first.

> [!REMEMBER]
> No training · distance → k nearest → vote/average · scale features · small k = high variance, large k = high bias · O(nd) per prediction · curse of dimensionality.
