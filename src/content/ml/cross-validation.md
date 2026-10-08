You can't measure how well a model generalises on the data it learned from. **Train/validation/test splits** and **cross-validation** give honest estimates of performance on unseen data — and the same machinery is used to choose hyperparameters without fooling yourself.

## Three sets, three jobs

| Set | Used for | Touched how often |
|---|---|---|
| **Training** | fitting model parameters | every training run |
| **Validation** | choosing hyperparameters / models, early stopping | many times |
| **Test** | the final, unbiased estimate | **once**, at the very end |

Typical splits: 60/20/20 or 80/10/10; with huge datasets, a 1% test set can be plenty. If you tune on the test set, its score is no longer an honest estimate — you've overfitted to it.

## k-fold cross-validation

A single validation split wastes data and is noisy (a lucky or unlucky split). **k-fold CV** fixes both:

1. Shuffle and split the data into $k$ equal **folds**.
2. For each fold: train on the other $k - 1$ folds, evaluate on this one.
3. Report the **mean ± standard deviation** of the $k$ scores.

Every sample is used for validation exactly once and for training $k - 1$ times — exactly what the lab animates. $k = 5$ or $10$ are standard. **Leave-one-out** ($k = n$) is nearly unbiased but expensive and high-variance.

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score
from sklearn.neighbors import KNeighborsClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = load_breast_cancer(return_X_y=True)
model = make_pipeline(StandardScaler(), KNeighborsClassifier(n_neighbors=5))

for name, cv in [("KFold", KFold(5, shuffle=True, random_state=0)),
                 ("StratifiedKFold", StratifiedKFold(5, shuffle=True, random_state=0))]:
    scores = cross_val_score(model, X, y, cv=cv)
    print(f"{name:16s} {scores.round(3)}  mean {scores.mean():.3f} ± {scores.std():.3f}")
```

```output
KFold            [0.956 0.956 0.956 0.982 0.973]  mean 0.965 ± 0.011
StratifiedKFold  [0.93  0.991 0.956 0.965 0.982]  mean 0.965 ± 0.021
```

Putting the scaler **inside the pipeline** matters: it is re-fitted on each training split, so no information from the validation fold leaks in.

## Variants for special data

| Variant | When |
|---|---|
| **Stratified k-fold** | classification, especially imbalanced — keeps class proportions in every fold |
| **Group k-fold** | several rows per patient/user — keep each group entirely in one fold |
| **Time-series split** (forward chaining) | temporal data — always train on the past, validate on the future; never shuffle |
| **Repeated k-fold** | small data — repeat with different shuffles for a stabler estimate |
| **Nested CV** | tuning *and* estimating: an inner loop chooses hyperparameters, an outer loop scores the whole procedure |

## Hyperparameter tuning

```python
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, stratify=y, random_state=0)

pipe = make_pipeline(StandardScaler(), SVC())
grid = {"svc__C": np.logspace(-2, 2, 5), "svc__gamma": ["scale", 0.001, 0.01]}
search = GridSearchCV(pipe, grid, cv=5).fit(X_tr, y_tr)

print("best params:", {k: (float(v) if not isinstance(v, str) else v) for k, v in search.best_params_.items()})
print(f"CV accuracy {search.best_score_:.3f} | held-out test accuracy {search.score(X_te, y_te):.3f}")
```

```output
best params: {'svc__C': 100.0, 'svc__gamma': 0.001}
CV accuracy 0.988 | held-out test accuracy 0.958
```

| Method | How | Good for |
|---|---|---|
| **Grid search** | every combination of listed values | few hyperparameters |
| **Random search** | random combinations from distributions | many hyperparameters — usually finds good settings faster than a grid |
| **Bayesian optimisation** (Optuna, scikit-optimize) | models the score surface to pick promising candidates | expensive models |
| **Successive halving / Hyperband** | discard weak candidates early | large searches |

Search continuous hyperparameters like learning rate, `C` and `alpha` on a **log scale**.

> [!WARNING]
> - **Leakage**: preprocessing (scaling, imputation, feature selection, oversampling) fitted on the full data before CV. Put it in a `Pipeline`.
> - Shuffling time-series data, or splitting a patient's records across train and validation.
> - Reporting the best CV score from a big search as the final performance — it is optimistically biased; confirm on the untouched test set (or use nested CV).
> - Using plain k-fold on a rare-class problem — some folds may contain no positives.

## Interview questions

> [!INTERVIEW] Why use cross-validation instead of a single train/validation split?
> It uses all data for both training and validation and averages over $k$ splits, giving a more reliable (lower-variance) estimate and a sense of its spread.

> [!INTERVIEW] What's the difference between the validation set and the test set?
> The validation set is used repeatedly to make decisions (hyperparameters, model choice); the test set is used once at the end for an unbiased estimate of the final model.

> [!INTERVIEW] How do you cross-validate time-series data?
> With forward-chaining splits (`TimeSeriesSplit`): each fold trains on an earlier window and validates on the period right after it, never using future data to predict the past.

> [!REMEMBER]
> Train fits, validation decides, test reports (once) · k-fold → mean ± std · stratify for classes, group for entities, time-series split for time · preprocessing inside a Pipeline · grid/random/Bayesian search on log scales.
