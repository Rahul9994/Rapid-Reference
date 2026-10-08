A **support vector machine (SVM)** looks for the boundary that separates two classes with the **widest possible margin** — the biggest empty "street" between them. Only the points on the edge of that street, the **support vectors**, decide where it goes. With kernels, SVMs draw curved boundaries too.

## The maximum-margin idea

A linear classifier predicts $\operatorname{sign}(\mathbf{w}^\top\mathbf{x} + b)$. Many lines separate separable data; the SVM picks the one farthest from the nearest points. Scaling $\mathbf{w}$ so the closest points satisfy $y_i(\mathbf{w}^\top\mathbf{x}_i + b) = 1$, the street's edges are $\mathbf{w}^\top\mathbf{x} + b = \pm 1$ and its width is

$$
\text{margin} = \frac{2}{\lVert \mathbf{w} \rVert}
$$

So maximising the margin means minimising $\lVert\mathbf{w}\rVert$:

$$
\min_{\mathbf{w}, b}\ \frac{1}{2}\lVert \mathbf{w} \rVert^2 \quad \text{subject to}\quad y_i(\mathbf{w}^\top\mathbf{x}_i + b) \ge 1 \ \ \forall i
$$

This is the **hard-margin** SVM. A wide margin is a form of regularization — it tends to generalise well.

## Soft margin and the C parameter

Real data overlaps, and one outlier shouldn't dictate the boundary. The **soft-margin** SVM lets points violate the margin at a cost, using the **hinge loss** $\max(0,\ 1 - y_i(\mathbf{w}^\top\mathbf{x}_i + b))$:

$$
\min_{\mathbf{w}, b}\ \frac{1}{2}\lVert \mathbf{w} \rVert^2 + C\sum_{i=1}^{n} \max\big(0,\ 1 - y_i(\mathbf{w}^\top\mathbf{x}_i + b)\big)
$$

- **Large C** → violations are expensive → narrow margin that fits the training data tightly (risk of overfitting).
- **Small C** → violations are cheap → wider margin, more misclassified training points (more regularization).

The lab minimises the equivalent form $\frac{\lambda}{2}\lVert\mathbf{w}\rVert^2 + \frac{1}{n}\sum \text{hinge}$ with gradient descent ($\lambda \approx 1/(nC)$). Toggle **Add an outlier** and raise $\lambda$ to see the soft margin ignore it.

> [!TIP] Why only support vectors matter
> The hinge loss is exactly 0 for points outside the margin, so they contribute no gradient. Delete any of them and the solution is unchanged — only points on or inside the margin "support" the boundary.

## The kernel trick

Some data isn't linearly separable in its original space but becomes separable after mapping to more features $\phi(\mathbf{x})$:

```viz svm-kernel Lifting 1-D points with x → (x, x²) makes them separable by a straight line.
```

The SVM's dual formulation only ever uses **dot products** between points, $\mathbf{x}_i^\top\mathbf{x}_j$. A **kernel** $K(\mathbf{x}_i, \mathbf{x}_j) = \phi(\mathbf{x}_i)^\top\phi(\mathbf{x}_j)$ computes that dot product in the high-dimensional space *without ever building* $\phi$:

| Kernel | Formula | Use |
|---|---|---|
| Linear | $\mathbf{x}^\top\mathbf{z}$ | many features (text), large data |
| Polynomial | $(\gamma\,\mathbf{x}^\top\mathbf{z} + r)^d$ | feature interactions |
| RBF (Gaussian) | $\exp(-\gamma \lVert \mathbf{x} - \mathbf{z} \rVert^2)$ | the default non-linear choice |
| Sigmoid | $\tanh(\gamma\,\mathbf{x}^\top\mathbf{z} + r)$ | rarely used |

For the RBF kernel, **$\gamma$** sets how far each point's influence reaches: large $\gamma$ → very local, wiggly boundaries (overfitting); small $\gamma$ → smooth boundaries. Tune $C$ and $\gamma$ together.

```python
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC

X, y = make_moons(n_samples=300, noise=0.2, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)

for kernel in ["linear", "rbf"]:
    clf = make_pipeline(StandardScaler(), SVC(kernel=kernel, C=1.0, gamma="scale"))
    clf.fit(X_tr, y_tr)
    n_sv = clf[-1].n_support_.sum()
    print(f"{kernel:6s} test accuracy {clf.score(X_te, y_te):.3f}, support vectors {n_sv}")
```

```output
linear test accuracy 0.813, support vectors 75
rbf    test accuracy 0.987, support vectors 58
```

## SVM vs logistic regression

| | SVM | Logistic regression |
|---|---|---|
| Loss | hinge (ignores well-classified points) | log-loss (every point contributes) |
| Output | a score / class; probabilities need calibration | calibrated probabilities |
| Non-linear | kernels, elegantly | needs manual feature engineering |
| Scaling to millions of rows | kernel SVMs are slow ($O(n^2)$–$O(n^3)$) | fast |

SVMs also do regression (**SVR**, with an $\varepsilon$-insensitive tube) and novelty detection (one-class SVM).

> [!WARNING]
> - Forgetting to **scale features** — distances and dot products depend on scale.
> - Using an RBF kernel on a huge dataset (training cost grows roughly quadratically or worse); use `LinearSVC` or `SGDClassifier`.
> - Tuning $C$ and $\gamma$ on a linear grid — use a log grid such as $10^{-3} \dots 10^{3}$.
> - Expecting `predict_proba` by default — it needs `probability=True` (extra cross-validated calibration).

## Interview questions

> [!INTERVIEW] What are support vectors?
> The training points that lie on the margin or violate it. They alone determine the decision boundary; all other points could be removed without changing it.

> [!INTERVIEW] What is the kernel trick?
> Replacing dot products with a kernel function that equals a dot product in a higher-dimensional feature space, so the SVM can learn non-linear boundaries without explicitly computing the mapped features.

> [!INTERVIEW] What does C control?
> The penalty for margin violations. High C = hard margin, low bias, high variance. Low C = soft, wider margin, more bias, less variance.

> [!REMEMBER]
> Maximise margin $2/\lVert\mathbf{w}\rVert$ · hinge loss + $C$ · support vectors define everything · kernels (RBF default, tune $C$, $\gamma$) · scale features · slow on very large data.
