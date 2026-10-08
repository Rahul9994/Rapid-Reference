An **ensemble** combines many models into one that is more accurate and more stable than any of its members. The two big families attack different problems: **bagging** reduces variance by averaging many independent models; **boosting** reduces bias by training models one after another, each fixing the previous ones' mistakes.

## Bagging (bootstrap aggregating)

1. Draw $B$ **bootstrap samples** — each is $n$ rows sampled *with replacement* from the training set (so ~63% of unique rows appear in each, some repeated).
2. Train one model (usually a deep decision tree) on each sample.
3. Combine: **majority vote** (classification) or **average** (regression).

Why it works: averaging $B$ models with variance $\sigma^2$ and pairwise correlation $\rho$ gives variance

$$
\rho\,\sigma^2 + \frac{1-\rho}{B}\,\sigma^2
$$

More models shrink the second term; **less correlated** models shrink the first. Deep trees have low bias but high variance — the perfect candidates.

> [!NOTE] Out-of-bag (OOB) evaluation
> Each tree never saw the ~37% of rows left out of its bootstrap sample. Predicting those rows with only the trees that skipped them gives a free validation estimate (`oob_score=True`).

## Random forests

A random forest is bagging with trees **plus feature randomness**: at every split, each tree only considers a random subset of features (commonly $\sqrt{d}$ for classification). This de-correlates the trees (smaller $\rho$), so averaging helps much more.

- Strong default: little tuning, robust to outliers and irrelevant features, no scaling needed.
- Key hyperparameters: `n_estimators` (more is better, with diminishing returns), `max_features`, `max_depth` / `min_samples_leaf`.

## Boosting

Boosting trains weak learners **sequentially**. Each new learner focuses on what the ensemble so far gets wrong.

### AdaBoost — the algorithm in the lab

Labels $y_i \in \{-1, +1\}$, weights start equal $w_i = 1/n$. For round $t = 1 \dots T$:

1. Fit a weak learner $h_t$ (a decision **stump** — a one-split tree) to the **weighted** data.
2. Weighted error: $\varepsilon_t = \sum_{i:\,h_t(x_i) \ne y_i} w_i$
3. Its say in the final vote: $\alpha_t = \tfrac{1}{2}\ln\dfrac{1 - \varepsilon_t}{\varepsilon_t}$ (bigger when the error is small)
4. Re-weight: $w_i \leftarrow w_i \, e^{-\alpha_t y_i h_t(x_i)}$, then normalise. Misclassified points ($y_i h_t(x_i) = -1$) grow; correct ones shrink.

Final prediction:

$$
H(\mathbf{x}) = \operatorname{sign}\left(\sum_{t=1}^{T} \alpha_t\, h_t(\mathbf{x})\right)
$$

In the lab, dot size is the sample weight — watch the hard points near the circle's edge swell until a stump is forced to deal with them, while the background (the weighted vote) bends into a circle that no single straight cut could make.

### Gradient boosting

Gradient boosting generalises the idea to any differentiable loss: each new tree is fit to the **negative gradient** of the loss with respect to the current predictions — for squared error, that is simply the **residuals**:

$$
F_t(\mathbf{x}) = F_{t-1}(\mathbf{x}) + \eta\, h_t(\mathbf{x}), \qquad h_t \approx \text{residuals } y - F_{t-1}(\mathbf{x})
$$

The learning rate $\eta$ (shrinkage) and shallow trees (depth 3–8) keep each step small. **XGBoost, LightGBM and CatBoost** are optimised implementations and dominate competitions on tabular data.

## Comparing them

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import cross_val_score
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import (RandomForestClassifier, AdaBoostClassifier,
                              GradientBoostingClassifier)

X, y = load_breast_cancer(return_X_y=True)
models = {
    "single tree": DecisionTreeClassifier(random_state=0),
    "random forest": RandomForestClassifier(n_estimators=200, random_state=0),
    "AdaBoost": AdaBoostClassifier(n_estimators=200, random_state=0),
    "gradient boosting": GradientBoostingClassifier(random_state=0),
}
for name, model in models.items():
    print(f"{name:18s} {cross_val_score(model, X, y, cv=5).mean():.3f}")
```

```output
single tree        0.917
random forest      0.960
AdaBoost           0.977
gradient boosting  0.963
```

| | Bagging / random forest | Boosting |
|---|---|---|
| Training | parallel, independent models | sequential, each depends on the last |
| Base learners | deep trees (low bias, high variance) | shallow trees / stumps (high bias, low variance) |
| Mainly reduces | variance | bias (and variance) |
| Overfitting risk | low; more trees don't hurt | can overfit with too many rounds — use a small learning rate + early stopping |
| Sensitivity to noisy labels | robust | AdaBoost especially sensitive (keeps up-weighting outliers) |

## Stacking and voting

- **Voting**: combine different model types by majority vote (hard) or averaged probabilities (soft).
- **Stacking**: train a **meta-model** on the out-of-fold predictions of several base models.

> [!WARNING]
> - Expecting bagging to help a high-bias model (e.g. bagging linear regressions changes little).
> - Training boosting for thousands of rounds without early stopping.
> - Using impurity-based feature importances from forests as ground truth; they favour high-cardinality features.
> - Forgetting that ensembles trade away interpretability.

## Interview questions

> [!INTERVIEW] Bagging vs boosting?
> Bagging trains independent models on bootstrap samples in parallel and averages them to reduce variance. Boosting trains models sequentially, each focusing on previous errors, to reduce bias. Random forest is bagging; AdaBoost and gradient boosting are boosting.

> [!INTERVIEW] What makes a random forest better than bagged trees?
> Random feature subsets at each split de-correlate the trees, so averaging cancels more of their errors.

> [!INTERVIEW] What does gradient boosting fit at each step?
> A new weak learner trained on the negative gradient of the loss with respect to the current ensemble's predictions — the residuals, for squared error — added with a small learning rate.

> [!REMEMBER]
> Bagging = bootstrap + average (↓ variance) · Random forest = bagging + random features · Boosting = sequential, fix mistakes (↓ bias) · AdaBoost re-weights samples · Gradient boosting fits residuals · XGBoost/LightGBM rule tabular data.
