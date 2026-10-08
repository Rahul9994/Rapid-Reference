**Regularization** fights overfitting by adding a penalty for large weights to the loss. The model must now balance fitting the data against keeping its weights small, which produces simpler, smoother functions that generalise better.

$$
J_{\text{reg}}(\mathbf{w}) = \underbrace{\text{Loss}(\mathbf{w})}_{\text{fit the data}} + \lambda \cdot \underbrace{\Omega(\mathbf{w})}_{\text{stay simple}}
$$

$\lambda \ge 0$ controls the trade-off: $\lambda = 0$ is the original model, a huge $\lambda$ shrinks all weights toward 0 (underfitting). The bias term $b$ is usually **not** penalised.

## Ridge (L2)

$$
\Omega(\mathbf{w}) = \lVert \mathbf{w} \rVert_2^2 = \sum_j w_j^2
$$

- Shrinks every weight smoothly toward zero, but almost never to *exactly* zero.
- Has a closed form for linear regression: $\mathbf{w} = (X^\top X + \lambda I)^{-1} X^\top \mathbf{y}$. Adding $\lambda I$ also makes the matrix invertible — ridge is a classic fix for **multicollinearity**.
- In neural networks the same idea is called **weight decay**.

## Lasso (L1)

$$
\Omega(\mathbf{w}) = \lVert \mathbf{w} \rVert_1 = \sum_j |w_j|
$$

- Drives some weights to **exactly zero** → automatic **feature selection** and sparse models.
- No closed form (the absolute value has a kink at 0); solved with coordinate descent using *soft-thresholding*.
- With strongly correlated features it tends to pick one arbitrarily.

## Why L1 gives zeros — the geometry in the lab

Penalised regression is equivalent to minimising the loss **subject to a budget** $\Omega(\mathbf{w}) \le t$. The loss contours are ellipses around the unregularized solution $\mathbf{w}_{\text{ols}}$; the solution is the first point where an ellipse touches the budget region.

- The **L2 budget is a circle** — smooth everywhere, so the touching point is almost never on an axis.
- The **L1 budget is a diamond** — its corners stick out along the axes, and the expanding ellipse very often hits a corner first, where one coordinate is exactly 0.

Switch the lab between Lasso and Ridge and watch the coefficient paths: the lasso path for $w_2$ hits zero and stays there; the ridge paths only approach it.

## Elastic Net

Combines both penalties:

$$
\Omega(\mathbf{w}) = \rho\,\lVert \mathbf{w} \rVert_1 + \frac{1-\rho}{2}\lVert \mathbf{w} \rVert_2^2
$$

It keeps lasso's sparsity while behaving better with groups of correlated features.

## In scikit-learn

```python
import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(0)
n = 100
X = rng.normal(size=(n, 6))
# only the first two features matter
y = 3 * X[:, 0] - 2 * X[:, 1] + rng.normal(0, 1.0, n)
X = StandardScaler().fit_transform(X)       # penalties assume comparable scales

for name, model in [("OLS", LinearRegression()),
                    ("Ridge", Ridge(alpha=10.0)),
                    ("Lasso", Lasso(alpha=0.2))]:
    model.fit(X, y)
    print(f"{name:5s}", np.round(model.coef_, 2))
```

```output
OLS   [ 2.95 -1.76  0.01  0.25  0.06  0.2 ]
Ridge [ 2.68 -1.61  0.01  0.2   0.08  0.21]
Lasso [ 2.75 -1.59  0.    0.    0.    0.  ]
```

Lasso set the four useless weights to exactly 0; ridge only shrank everything a little.

> [!NOTE] Naming conventions differ
> scikit-learn calls the strength `alpha` (not $\lambda$). `Lasso` minimises $\frac{1}{2n}\lVert \mathbf{y} - X\mathbf{w}\rVert^2 + \alpha\lVert\mathbf{w}\rVert_1$ while `Ridge` minimises $\lVert \mathbf{y} - X\mathbf{w}\rVert^2 + \alpha\lVert\mathbf{w}\rVert^2$, so equal `alpha` values are not equally strong. In `LogisticRegression` and `SVC`, `C` is the **inverse** of the regularization strength: smaller `C` = stronger regularization.

## Choosing $\lambda$

Search over a **log-scale** grid with cross-validation: `RidgeCV`, `LassoCV`, or `GridSearchCV` over `alpha` values like `np.logspace(-3, 3, 13)`. See [Cross-Validation & Tuning](/ml/cross-validation).

## Regularization beyond linear models

- **Neural networks**: weight decay (L2), dropout, early stopping, data augmentation, batch normalisation (mild effect).
- **Trees**: limit depth, minimum samples per leaf, pruning.
- **SVMs**: the `C` parameter.

> [!WARNING]
> - Regularizing **unscaled** features: the penalty then punishes features just for being measured in small units.
> - Penalising the intercept.
> - Reading lasso's choice among correlated features as "the other feature doesn't matter".
> - Mixing up `C` (inverse strength) and `alpha` (strength).

## Interview questions

> [!INTERVIEW] L1 vs L2 regularization?
> L2 (ridge) adds $\sum w_j^2$: smooth shrinkage, keeps all features, has a closed form, handles multicollinearity. L1 (lasso) adds $\sum |w_j|$: produces exact zeros (feature selection) because its diamond-shaped constraint has corners on the axes.

> [!INTERVIEW] Why does regularization reduce overfitting?
> It limits how large (and so how wiggly and data-specific) the learned function can be. That increases bias slightly but can reduce variance a lot, lowering test error.

> [!INTERVIEW] What happens as $\lambda \to \infty$?
> All penalised weights go to zero; the model predicts roughly the mean of $y$ (the intercept) — maximum bias.

> [!REMEMBER]
> Loss + $\lambda\cdot$penalty · L2 = shrink (circle) · L1 = sparse (diamond corners) · Elastic Net = both · scale features first · tune $\lambda$ on a log grid with CV.
