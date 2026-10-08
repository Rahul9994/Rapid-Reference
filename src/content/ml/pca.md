**Principal component analysis (PCA)** finds new axes for your data, ordered by how much of the data's spread (variance) they capture. Keeping only the first few axes compresses many correlated features into a handful while losing as little information as possible — for visualisation, noise reduction, or speeding up other models.

## The intuition

In the lab, the two features are strongly correlated, so the cloud is a tilted ellipse. Spin a line through its centre and project every point onto it: the projected points spread out most along the ellipse's long axis. That direction is **principal component 1 (PC1)**. **PC2** is perpendicular to it and captures what's left. Dropping PC2 turns 2-D data into 1-D with little loss.

## The algorithm

1. **Centre** the data: subtract each feature's mean (and usually standardize — see below).
2. Compute the **covariance matrix** $\Sigma = \frac{1}{n-1} X_c^\top X_c$.
3. **Eigen-decompose** it: $\Sigma \mathbf{v}_j = \lambda_j \mathbf{v}_j$. The eigenvectors $\mathbf{v}_j$ are the principal directions; the eigenvalues $\lambda_j$ are the variance along each.
4. **Sort** by eigenvalue, largest first.
5. **Project** onto the top $k$ eigenvectors: $Z = X_c V_k$.

The share of variance kept by component $j$ is

$$
\text{explained variance ratio}_j = \frac{\lambda_j}{\sum_i \lambda_i}
$$

> [!NOTE] Why the eigenvector?
> The variance of the data projected onto a unit vector $\mathbf{u}$ is $\mathbf{u}^\top \Sigma\, \mathbf{u}$. Maximising this subject to $\lVert \mathbf{u} \rVert = 1$ (with a Lagrange multiplier) gives $\Sigma\mathbf{u} = \lambda\mathbf{u}$ — the top eigenvector, with the variance equal to its eigenvalue. That's why the lab's sweep peaks exactly at PC1.

```python
import numpy as np

rng = np.random.default_rng(0)
t = rng.normal(size=200)
X = np.column_stack([t + 0.3 * rng.normal(size=200),
                     2 * t + 0.3 * rng.normal(size=200)])   # strongly correlated

X_c = X - X.mean(axis=0)
cov = np.cov(X_c, rowvar=False)
eigvals, eigvecs = np.linalg.eigh(cov)          # eigh: for symmetric matrices
order = np.argsort(eigvals)[::-1]
eigvals, eigvecs = eigvals[order], eigvecs[:, order]

print("explained variance ratio:", np.round(eigvals / eigvals.sum(), 3))
print("PC1 direction:", np.round(eigvecs[:, 0] * np.sign(eigvecs[0, 0]), 3))
Z = X_c @ eigvecs[:, :1]                        # 2 features -> 1
print("reduced shape:", Z.shape)
```

```output
explained variance ratio: [0.982 0.018]
PC1 direction: [0.437 0.899]
reduced shape: (200, 1)
```

## With scikit-learn

```python
from sklearn.datasets import load_digits
from sklearn.decomposition import PCA
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, _ = load_digits(return_X_y=True)             # 1797 images x 64 pixels
pca = make_pipeline(StandardScaler(), PCA(n_components=0.90))   # keep 90% variance
Z = pca.fit_transform(X)
print(X.shape, "->", Z.shape)
print(f"variance kept: {pca[-1].explained_variance_ratio_.sum():.3f}")
```

```output
(1797, 64) -> (1797, 31)
variance kept: 0.900
```

Passing a fraction to `n_components` keeps as many components as needed to reach that share of variance. A **scree plot** (explained variance per component) helps choose $k$ by eye.

## Practical notes

- **Standardize first** when features have different units; otherwise the feature with the largest numeric range dominates PC1.
- PCA is **linear**. Curved structure (a "Swiss roll") needs non-linear methods: kernel PCA, t-SNE or UMAP (the latter two are mainly for visualisation).
- Components are **combinations of all features** — harder to interpret than the originals.
- Computed in practice with the **SVD** of $X_c$ (more numerically stable than forming $\Sigma$): $X_c = U S V^\top$, principal directions are the columns of $V$ and $\lambda_j = s_j^2/(n-1)$.
- Fit PCA on the **training set only** and reuse it on test data (it is a preprocessing step that learns from data).

## Uses

- Visualise high-dimensional data in 2-D or 3-D.
- Speed up training and fight the curse of dimensionality.
- Remove noise (drop low-variance components) and multicollinearity.
- Compression (e.g. eigenfaces).

> [!WARNING]
> - Skipping centring (PCA must be computed on centred data).
> - Forgetting to scale features with different units.
> - Assuming the top components are the most *predictive* — they capture variance, not relevance to the target.
> - Fitting PCA on the full dataset before a train/test split (leakage).

## Interview questions

> [!INTERVIEW] What does PCA do, in one sentence?
> It rotates the data onto orthogonal axes ordered by variance so you can keep the first few and drop the rest with minimal information loss.

> [!INTERVIEW] How are principal components computed?
> As eigenvectors of the covariance matrix of the centred data (sorted by eigenvalue), or equivalently via the SVD of the centred data matrix.

> [!INTERVIEW] Is PCA supervised? Does it use labels?
> No — it is unsupervised and ignores the target. (LDA is the supervised counterpart that finds directions separating classes.)

> [!REMEMBER]
> Centre (and scale) → covariance → eigenvectors sorted by eigenvalue → project · explained variance ratio = $\lambda_j/\sum\lambda$ · linear, unsupervised · fit on train only.
