K-means needs you to choose $k$ and assumes round clusters. Two other families avoid both limits: **DBSCAN** finds clusters as dense regions of any shape and labels sparse points as noise, and **hierarchical clustering** builds a whole tree of clusters you can cut at any level.

## DBSCAN — density-based clustering

DBSCAN (Density-Based Spatial Clustering of Applications with Noise) has two parameters:

- **$\varepsilon$ (eps)** — the neighbourhood radius.
- **min_pts** (`min_samples`) — how many points (including itself) must lie within $\varepsilon$ for a point to be dense.

Every point becomes one of three types:

| Type | Rule |
|---|---|
| **Core point** | at least `min_pts` points within $\varepsilon$ |
| **Border point** | not core, but within $\varepsilon$ of a core point |
| **Noise** | neither — labelled $-1$ |

**Algorithm**: pick an unvisited core point and start a cluster; add all its $\varepsilon$-neighbours; whenever an added point is itself core, add *its* neighbours too (the cluster spreads like a flood fill); when it can't grow, move to the next unvisited core point. The lab shows exactly this flood: rings mark core neighbourhoods, and grey points left at the end are noise.

```python
import numpy as np
from sklearn.cluster import DBSCAN, KMeans
from sklearn.datasets import make_moons
from sklearn.metrics import adjusted_rand_score

X, y = make_moons(n_samples=300, noise=0.06, random_state=0)
db = DBSCAN(eps=0.2, min_samples=5).fit(X)
km = KMeans(n_clusters=2, n_init=10, random_state=0).fit(X)

print("DBSCAN clusters:", len(set(db.labels_) - {-1}), "| noise points:", np.sum(db.labels_ == -1))
print(f"agreement with true moons  DBSCAN {adjusted_rand_score(y, db.labels_):.2f}"
      f"   k-means {adjusted_rand_score(y, km.labels_):.2f}")
```

```output
DBSCAN clusters: 2 | noise points: 0
agreement with true moons  DBSCAN 1.00   k-means 0.23
```

K-means slices the moons with a straight cut; DBSCAN follows their shape.

### Choosing parameters

- **min_pts**: a common rule of thumb is $\ge d + 1$ (often $2d$) for $d$ dimensions; larger values smooth out noise.
- **$\varepsilon$**: plot each point's distance to its $k$-th nearest neighbour ($k$ = min_pts) in sorted order — the **k-distance plot** — and pick $\varepsilon$ at the "knee".
- Too small $\varepsilon$ → everything is noise; too large → everything merges. Try it with the lab's slider.

### Strengths and weaknesses

| ✅ | ⚠️ |
|---|---|
| no need to choose the number of clusters | struggles when clusters have very **different densities** (one $\varepsilon$ for all) |
| arbitrary shapes | sensitive to $\varepsilon$; needs scaled features |
| explicit noise / outlier detection | high dimensions make distances less meaningful |

**HDBSCAN** extends DBSCAN to varying densities and is often a better default today.

## Hierarchical (agglomerative) clustering

1. Start with every point as its own cluster.
2. Repeatedly **merge the two closest clusters**.
3. Stop when one cluster remains — recording every merge and its distance.

The result is a **dendrogram**: a tree whose height shows how far apart merged clusters were. Cut it horizontally to get any number of clusters.

```diagram A dendrogram over five points — cutting at the dashed line gives two clusters
 height
   4 ┤           ┌────────┴────────┐
   3 ┤ - - - - - │ - - - - - - - - │ - - -  cut → 2 clusters
   2 ┤       ┌───┴───┐             │
   1 ┤   ┌───┴───┐   │         ┌───┴───┐
   0 ┼───A───────B───C─────────D───────E
```

How "distance between clusters" is defined is the **linkage**:

| Linkage | Cluster distance | Effect |
|---|---|---|
| Single | closest pair of points | finds chains/elongated shapes; prone to "chaining" |
| Complete | farthest pair of points | compact clusters |
| Average | mean of all pairwise distances | in between |
| **Ward** | increase in within-cluster variance after merging | compact, similar-size clusters (common default) |

```python
import numpy as np
from scipy.cluster.hierarchy import fcluster, linkage

X = np.array([[1, 1], [1.5, 1], [5, 5], [5.5, 5.2], [9, 1], [9.2, 1.4]])
Z = linkage(X, method="ward")                 # merge history (the dendrogram)
print(fcluster(Z, t=3, criterion="maxclust")) # cut into 3 clusters
print(fcluster(Z, t=2, criterion="maxclust")) # ... or 2
```

```output
[1 1 3 3 2 2]
[1 1 2 2 2 2]
```

Naive agglomerative clustering costs $O(n^3)$ time ($O(n^2)$ with good implementations) and $O(n^2)$ memory for the distance matrix — fine for thousands of points, not millions.

## Which clustering algorithm?

| Situation | Try |
|---|---|
| roughly round clusters, large data, known $k$ | k-means |
| arbitrary shapes, noise present, unknown $k$ | DBSCAN / HDBSCAN |
| want a hierarchy or small data | agglomerative (Ward) |
| elliptical clusters, soft membership | Gaussian mixture model |

> [!WARNING]
> - Not scaling features before any distance-based clustering.
> - Judging clusters only by a metric — always inspect whether they make sense.
> - Running hierarchical clustering on huge datasets (quadratic memory).
> - Expecting DBSCAN to separate clusters of very different densities with one $\varepsilon$.

## Interview questions

> [!INTERVIEW] DBSCAN vs k-means?
> K-means needs $k$, assumes spherical clusters and assigns every point. DBSCAN needs $\varepsilon$ and min_pts, finds arbitrarily shaped clusters, determines the number of clusters itself and labels outliers as noise.

> [!INTERVIEW] What are core, border and noise points?
> Core: at least min_pts neighbours within $\varepsilon$. Border: within $\varepsilon$ of a core point but not core itself. Noise: neither.

> [!INTERVIEW] What is a dendrogram and how do you get clusters from it?
> A tree recording the order and distance of merges in hierarchical clustering. Cutting it at a chosen height (or asking for a number of clusters) gives a flat clustering.

> [!REMEMBER]
> DBSCAN: eps + min_pts, core/border/noise, any shape, no k · Hierarchical: merge closest clusters, dendrogram, linkage (Ward/single/complete/average), cut to choose k.
