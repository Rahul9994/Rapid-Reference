**K-means** groups unlabelled data into $k$ clusters, where each point belongs to the cluster with the nearest centre (**centroid**). It is the most widely used clustering algorithm: simple, fast, and good enough for customer segmentation, image colour quantisation, and as a building block in larger systems.

## Lloyd's algorithm

1. **Initialise** $k$ centroids (random data points, or k-means++).
2. **Assign** every point to its nearest centroid.
3. **Update** each centroid to the mean of the points assigned to it.
4. Repeat 2–3 until the assignments (or centroids) stop changing.

That is exactly what the lab animates: points recolour (assign), then the ◆ centroids glide to their cluster means (update), leaving dashed trails.

## What it optimises

K-means minimises the **inertia** — the within-cluster sum of squared distances:

$$
J = \sum_{j=1}^{k}\ \sum_{\mathbf{x} \in C_j} \lVert \mathbf{x} - \boldsymbol{\mu}_j \rVert^2
$$

Each step can only lower (or keep) $J$: assigning to the nearest centroid reduces every point's distance, and the mean is the point that minimises squared distances to a group. So the algorithm always **converges** — but to a **local** minimum that depends on the starting centroids.

```python
import numpy as np

def kmeans(X, k, iters=100, seed=0):
    rng = np.random.default_rng(seed)
    C = X[rng.choice(len(X), k, replace=False)]          # random init
    for _ in range(iters):
        labels = np.linalg.norm(X[:, None] - C[None], axis=2).argmin(axis=1)
        C_new = np.array([X[labels == j].mean(axis=0) for j in range(k)])
        if np.allclose(C, C_new):
            break
        C = C_new
    inertia = ((X - C[labels]) ** 2).sum()
    return labels, C, inertia

rng = np.random.default_rng(1)
X = np.vstack([rng.normal(c, 0.5, (40, 2)) for c in [(0, 0), (4, 4), (0, 5)]])
labels, C, inertia = kmeans(X, k=3)
print(np.round(C[np.argsort(C[:, 0] + C[:, 1])], 2))
print(f"inertia = {inertia:.1f}, sizes = {np.bincount(labels)}")
```

```output
[[-0.01 -0.06]
 [-0.09  5.  ]
 [ 3.91  3.97]]
inertia = 50.2, sizes = [40 40 40]
```

## Initialisation and k-means++

Bad starting centroids (e.g. two inside the same blob) give poor local minima — click **New random start** in the lab a few times. Fixes:

- **k-means++**: pick the first centroid at random, then pick each next one with probability proportional to its squared distance from the nearest existing centroid — spreading them out. This is scikit-learn's default.
- **Multiple restarts** (`n_init`): run several times and keep the lowest inertia.

## Choosing k

- **Elbow method**: plot inertia against $k$; inertia always falls as $k$ grows, so look for the "elbow" where improvement slows sharply.
- **Silhouette score**: for each point, $s = \frac{b - a}{\max(a, b)}$ where $a$ is the mean distance to its own cluster and $b$ to the nearest other cluster. Ranges from −1 to 1; higher is better.
- Domain knowledge (e.g. "we want 5 customer tiers").

```python
import numpy as np
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score

rng = np.random.default_rng(1)
X = np.vstack([rng.normal(c, 0.5, (40, 2)) for c in [(0, 0), (4, 4), (0, 5)]])
for k in range(2, 7):
    km = KMeans(n_clusters=k, n_init=10, random_state=0).fit(X)
    print(f"k={k}: inertia {km.inertia_:7.1f}  silhouette {silhouette_score(X, km.labels_):.3f}")
```

```output
k=2: inertia   391.2  silhouette 0.638
k=3: inertia    50.2  silhouette 0.815
k=4: inertia    42.9  silhouette 0.666
k=5: inertia    36.7  silhouette 0.489
k=6: inertia    32.1  silhouette 0.322
```

Both the elbow and the best silhouette point to $k = 3$ — the true number of blobs.

## Complexity

Each iteration costs $O(n \cdot k \cdot d)$; it usually converges in a few dozen iterations, so k-means scales to large datasets (and **Mini-batch k-means** scales further).

## Limitations

K-means implicitly assumes clusters are **round (spherical), similar in size and similar in density**, because it only uses distance to a centre. It fails on:

- elongated or curved clusters (moons, rings) → use [DBSCAN](/ml/dbscan-hierarchical) or spectral clustering;
- clusters of very different sizes/densities;
- outliers, which drag centroids (k-medoids is more robust);
- unscaled features — scale first.

Gaussian mixture models generalise k-means with elliptical clusters and soft (probabilistic) assignments.

> [!WARNING]
> - Forgetting to scale features.
> - Trusting a single run — use k-means++ and several `n_init` restarts.
> - Picking $k$ by the lowest inertia (it always prefers larger $k$).
> - Treating cluster IDs as meaningful labels — they are arbitrary and change between runs.

## Interview questions

> [!INTERVIEW] Explain the k-means algorithm.
> Initialise $k$ centroids; repeat: assign each point to its nearest centroid, then move each centroid to the mean of its assigned points; stop when nothing changes. It minimises within-cluster squared distances.

> [!INTERVIEW] Does k-means always find the global optimum?
> No. It always converges, but to a local minimum that depends on initialisation. k-means++ and multiple restarts mitigate this.

> [!INTERVIEW] How do you choose k?
> Elbow method on inertia, silhouette score, gap statistic, or business constraints — validated by whether the clusters are useful.

> [!REMEMBER]
> Assign → update → repeat · minimises inertia · local optimum → k-means++ & restarts · choose k by elbow/silhouette · assumes round, similar-size clusters · scale features.
