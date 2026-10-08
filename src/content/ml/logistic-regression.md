Despite its name, **logistic regression is a classification algorithm**. It computes a linear score, squashes it into a probability with the sigmoid function, and predicts the class whose probability is higher. It is fast, interpretable, and the go-to baseline for binary classification.

## From score to probability

First a linear score — exactly like linear regression:

$$
z = \mathbf{w}^\top \mathbf{x} + b
$$

Then the **sigmoid** (logistic) function maps any real number into $(0, 1)$:

$$
\sigma(z) = \frac{1}{1 + e^{-z}}, \qquad P(y = 1 \mid \mathbf{x}) = \sigma(\mathbf{w}^\top \mathbf{x} + b)
$$

- $z = 0 \Rightarrow p = 0.5$ (the model is unsure)
- large positive $z \Rightarrow p \to 1$, large negative $z \Rightarrow p \to 0$

Predict class 1 when $p \ge 0.5$, i.e. when $z \ge 0$. So the **decision boundary** $\mathbf{w}^\top\mathbf{x} + b = 0$ is a straight line (a hyperplane in higher dimensions) — the solid line in the lab. The dashed lines are $p = 0.1$ and $p = 0.9$.

> [!TIP] Log-odds
> Rearranging gives $\log\frac{p}{1-p} = \mathbf{w}^\top\mathbf{x} + b$. Logistic regression is linear in the **log-odds**: increasing $x_j$ by 1 multiplies the odds by $e^{w_j}$.

## The loss: log-loss (binary cross-entropy)

$$
J(\mathbf{w}, b) = -\frac{1}{n}\sum_{i=1}^{n}\Big[y_i \log p_i + (1 - y_i)\log(1 - p_i)\Big]
$$

It is the negative log-likelihood of the labels. Confident correct predictions cost almost nothing; confident wrong ones cost a lot ($-\log 0.01 \approx 4.6$).

> [!NOTE] Why not MSE?
> With the sigmoid inside, squared error gives a non-convex loss with flat regions where gradients vanish. Log-loss is **convex** for logistic regression, so gradient descent reliably reaches the global minimum.

## The gradient is beautifully simple

$$
\frac{\partial J}{\partial \mathbf{w}} = \frac{1}{n} X^\top (\mathbf{p} - \mathbf{y}), \qquad \frac{\partial J}{\partial b} = \frac{1}{n}\sum_i (p_i - y_i)
$$

The same "error × input" shape as linear regression — which is exactly what the lab's code computes.

```python
import numpy as np

rng = np.random.default_rng(0)
X = np.vstack([rng.normal([-1, -0.6], 0.7, (50, 2)), rng.normal([1, 0.7], 0.7, (50, 2))])
y = np.array([0] * 50 + [1] * 50)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

w, b, lr = np.zeros(2), 0.0, 0.5
for epoch in range(300):
    p = sigmoid(X @ w + b)
    w -= lr * X.T @ (p - y) / len(y)
    b -= lr * np.mean(p - y)

p = sigmoid(X @ w + b)
loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
print(f"w = {np.round(w, 3)}, b = {b:.3f}")
print(f"log-loss = {loss:.3f}, accuracy = {np.mean((p >= 0.5) == y):.2f}")
```

```output
w = [3.376 2.003], b = -0.071
log-loss = 0.152, accuracy = 0.93
```

## With scikit-learn

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression

X, y = load_breast_cancer(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(X, y, stratify=y, random_state=0)

clf = make_pipeline(StandardScaler(), LogisticRegression(C=1.0, max_iter=1000))
clf.fit(X_train, y_train)
print(f"test accuracy: {clf.score(X_test, y_test):.3f}")
print("P(benign) for first 3 test samples:", clf.predict_proba(X_test[:3])[:, 1].round(3))
```

```output
test accuracy: 0.958
P(benign) for first 3 test samples: [0.996 0.    0.   ]
```

`C` is the inverse regularization strength (L2 by default): smaller `C` = simpler model.

## More than two classes

- **One-vs-rest (OvR)**: train one binary classifier per class; pick the most confident.
- **Multinomial (softmax) regression**: one weight vector per class and the **softmax** turns $K$ scores into a probability distribution:

$$
P(y = k \mid \mathbf{x}) = \frac{e^{z_k}}{\sum_{j=1}^{K} e^{z_j}}
$$

trained with categorical cross-entropy. scikit-learn's `LogisticRegression` uses the multinomial formulation for multiclass problems with its default solver.

## Strengths and weaknesses

| ✅ Strengths | ⚠️ Weaknesses |
|---|---|
| fast, convex, scales to large data | linear boundary only (needs feature engineering for curves) |
| outputs probabilities (often well calibrated) | sensitive to outliers and correlated features |
| interpretable coefficients / odds ratios | struggles when classes are perfectly separable without regularization (weights → ∞) |

> [!WARNING]
> - Calling it a regression model in an interview without clarifying it is used for classification.
> - Forgetting to scale features (slow convergence, unfair regularization).
> - Treating 0.5 as a sacred threshold — tune it for the precision/recall trade-off you need ([Evaluation Metrics](/ml/evaluation-metrics)).
> - Taking `log(0)` in a hand-written loss — clip probabilities, e.g. `np.clip(p, 1e-12, 1 - 1e-12)`.

## Interview questions

> [!INTERVIEW] Why is it called "regression" if it classifies?
> It regresses the **log-odds** of the positive class on the features (a linear model for $\log\frac{p}{1-p}$); thresholding the resulting probability turns it into a classifier.

> [!INTERVIEW] What is the decision boundary of logistic regression?
> The set where $\mathbf{w}^\top\mathbf{x} + b = 0$ (probability exactly 0.5) — a hyperplane. Non-linear boundaries require transformed features such as polynomial terms.

> [!INTERVIEW] Logistic regression vs linear SVM?
> Both learn linear boundaries. Logistic regression minimises log-loss and gives probabilities; an SVM minimises hinge loss, only cares about points near the margin, and outputs scores rather than calibrated probabilities.

> [!REMEMBER]
> $p = \sigma(\mathbf{w}^\top\mathbf{x} + b)$ · log-loss (convex) · gradient $X^\top(\mathbf{p}-\mathbf{y})/n$ · linear boundary · softmax for multiclass · `C` = inverse regularization.
