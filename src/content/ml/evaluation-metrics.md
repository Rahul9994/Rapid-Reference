A model is only as good as the number you judge it by — and the wrong number can make a useless model look excellent. This page covers the metrics interviewers expect you to know, and when each one is the right choice.

## The confusion matrix

For binary classification, every prediction lands in one of four cells:

| | Predicted positive | Predicted negative |
|---|---|---|
| **Actually positive** | True Positive (TP) | False Negative (FN) — a *miss* |
| **Actually negative** | False Positive (FP) — a *false alarm* | True Negative (TN) |

Everything else is built from these four counts.

## Classification metrics

$$
\text{Accuracy} = \frac{TP + TN}{TP + TN + FP + FN}
\qquad
\text{Precision} = \frac{TP}{TP + FP}
\qquad
\text{Recall} = \frac{TP}{TP + FN}
$$

- **Precision** — of everything flagged positive, how much was right? ("When the spam filter says spam, is it?")
- **Recall** (sensitivity, true positive rate) — of all real positives, how many did we catch? ("Did we find all the cancers?")
- **Specificity** (true negative rate) $= \frac{TN}{TN + FP}$; **false positive rate** $= 1 - \text{specificity}$.
- **F1 score** — the harmonic mean, high only when *both* are high:

$$
F_1 = 2\cdot\frac{\text{precision}\cdot\text{recall}}{\text{precision} + \text{recall}}
$$

$F_\beta$ weights recall $\beta$ times as much as precision ($F_2$ for recall-heavy problems).

> [!IMPORTANT] The accuracy trap
> If 1% of transactions are fraud, a model that always says "not fraud" is 99% accurate and catches nothing. On **imbalanced** data, look at precision, recall, F1, PR-AUC and the confusion matrix.

## Which matters more: precision or recall?

| Situation | Costly error | Prioritise |
|---|---|---|
| Cancer screening, fraud detection, safety defects | missing a positive (FN) | **recall** |
| Spam filtering, recommending content, legal flags | false alarm (FP) | **precision** |
| Both errors matter similarly | — | F1, or a cost-weighted metric |

## The threshold trade-off

Most classifiers output a score or probability; the class depends on a **threshold** (0.5 by default). The lab sweeps it: lowering the threshold catches more positives (recall ↑) but lets more negatives through (precision ↓). Choose the threshold for your costs — don't assume 0.5.

## ROC curve and AUC

The **ROC curve** plots true positive rate (recall) against false positive rate for every threshold. **AUC** (area under it) summarises ranking quality in one number:

- AUC = 1.0 — perfect ranking; 0.5 — no better than random.
- Interpretation: the probability that a randomly chosen positive gets a higher score than a randomly chosen negative.
- Threshold-independent, but can look optimistic on heavily imbalanced data — there the **precision–recall curve** and **PR-AUC (average precision)** are more informative.

```python
import numpy as np
from sklearn.metrics import (accuracy_score, confusion_matrix, f1_score,
                             precision_score, recall_score, roc_auc_score)

y_true  = np.array([1, 1, 1, 1, 0, 0, 0, 0, 0, 0])
y_score = np.array([0.95, 0.80, 0.55, 0.30, 0.60, 0.40, 0.20, 0.15, 0.10, 0.05])

for t in [0.5, 0.25]:
    y_pred = (y_score >= t).astype(int)
    tn, fp, fn, tp = confusion_matrix(y_true, y_pred).ravel()
    print(f"threshold {t}: TP={tp} FP={fp} FN={fn} TN={tn} | "
          f"acc {accuracy_score(y_true, y_pred):.2f} "
          f"precision {precision_score(y_true, y_pred):.2f} "
          f"recall {recall_score(y_true, y_pred):.2f} "
          f"F1 {f1_score(y_true, y_pred):.2f}")
print(f"ROC-AUC {roc_auc_score(y_true, y_score):.3f}")
```

```output
threshold 0.5: TP=3 FP=1 FN=1 TN=5 | acc 0.80 precision 0.75 recall 0.75 F1 0.75
threshold 0.25: TP=4 FP=2 FN=0 TN=4 | acc 0.80 precision 0.67 recall 1.00 F1 0.80
ROC-AUC 0.875
```

## Multi-class averaging

- **Macro** — compute the metric per class, then average equally (every class matters the same).
- **Weighted** — average weighted by class frequency.
- **Micro** — pool all TP/FP/FN first (for single-label multi-class, micro-F1 equals accuracy).

`classification_report` prints them all.

## Regression metrics

| Metric | Formula | Notes |
|---|---|---|
| MAE | $\frac{1}{n}\sum \lvert y - \hat{y}\rvert$ | in target units; robust to outliers |
| MSE | $\frac{1}{n}\sum (y - \hat{y})^2$ | punishes large errors; squared units |
| RMSE | $\sqrt{\text{MSE}}$ | target units; still outlier-sensitive |
| $R^2$ | $1 - \frac{SS_{res}}{SS_{tot}}$ | variance explained; 1 is perfect, can be negative |
| MAPE | $\frac{100\%}{n}\sum \left\lvert \frac{y - \hat{y}}{y} \right\rvert$ | relative error; breaks when $y \approx 0$ |

## Other metrics worth knowing

- **Log-loss** — rewards well-calibrated probabilities.
- **Calibration** — do predicted 70% events happen ~70% of the time? (reliability curves)
- **Clustering** — silhouette score (no labels), adjusted Rand index (with labels).
- **Ranking / recommendation** — precision@k, recall@k, MAP, NDCG.

> [!WARNING]
> - Reporting accuracy on imbalanced data.
> - Choosing the threshold on the test set.
> - Comparing models on different test splits.
> - Forgetting that precision is undefined when nothing is predicted positive (sklearn warns and returns 0).
> - Optimising a metric the business doesn't care about.

## Interview questions

> [!INTERVIEW] Precision vs recall — explain with an example.
> For a cancer test, recall is the share of patients with cancer that the test catches; precision is the share of positive test results that really are cancer. Missing cancer is worse than a follow-up test, so we favour recall.

> [!INTERVIEW] What does an AUC of 0.8 mean?
> If you pick one random positive and one random negative example, there's an 80% chance the model scores the positive higher.

> [!INTERVIEW] Why use F1 instead of the arithmetic mean of precision and recall?
> The harmonic mean is dominated by the smaller value, so a model can't score well by maximising one and ignoring the other (precision 1.0, recall 0.01 gives F1 ≈ 0.02, not 0.5).

> [!REMEMBER]
> TP/FP/FN/TN · precision = TP/(TP+FP), recall = TP/(TP+FN) · F1 = harmonic mean · ROC-AUC = ranking quality; PR-AUC for imbalance · tune the threshold · MAE/RMSE/$R^2$ for regression.
