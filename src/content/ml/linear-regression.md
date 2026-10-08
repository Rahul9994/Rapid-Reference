Linear regression predicts a **continuous number** by fitting a straight line (or a flat plane, with more features) through data. It is the "hello world" of machine learning, and most of what follows in ML reuses its ideas: a model, a loss, and an optimizer.

## The model

With one feature $x$, the prediction is a line with slope $w$ (weight) and intercept $b$ (bias):

$$
\hat{y} = w\,x + b
$$

With $d$ features, it becomes a weighted sum — one weight per feature:

$$
\hat{y} = w_1 x_1 + w_2 x_2 + \dots + w_d x_d + b = \mathbf{w}^\top \mathbf{x} + b
$$

> [!TIP] Reading the weights
> $w_j$ is "how much $\hat{y}$ changes when $x_j$ goes up by 1, holding the other features fixed". In the lab above, $w \approx 1.45$ means each extra year of experience adds about 1.45 LPA.

## The loss: mean squared error

A residual is the vertical gap between truth and prediction, $e_i = \hat{y}_i - y_i$. **Mean squared error (MSE)** averages the squared residuals:

$$
J(w, b) = \frac{1}{n}\sum_{i=1}^{n} \left(\hat{y}_i - y_i\right)^2
$$

Squaring does two things: it makes every error positive, and it punishes big misses much more than small ones (an error of 4 costs 16, not 4). The "least squares" line is the one with the smallest $J$.

## Fitting it with gradient descent

$J(w, b)$ is a smooth bowl, so we can slide downhill. The partial derivatives tell us which way is "up":

$$
\frac{\partial J}{\partial w} = \frac{2}{n}\sum_{i=1}^{n} (\hat{y}_i - y_i)\,x_i
\qquad
\frac{\partial J}{\partial b} = \frac{2}{n}\sum_{i=1}^{n} (\hat{y}_i - y_i)
$$

and we step the other way, scaled by the **learning rate** $\alpha$:

$$
w \leftarrow w - \alpha \frac{\partial J}{\partial w}, \qquad b \leftarrow b - \alpha \frac{\partial J}{\partial b}
$$

That loop — predict, measure residuals, compute gradients, step — is exactly what the lab animates, one highlighted line at a time.

> [!NOTE] Why the lab standardizes x
> Gradient descent converges much faster when features are on similar scales. Standardizing ($z = (x - \mu)/\sigma$) turns the loss surface into a round bowl, so $w$ and $b$ learn at the same pace. See [Gradient Descent](/ml/gradient-descent) and [Data Preprocessing](/ml/data-preprocessing).

## The closed-form solution (normal equation)

Linear regression is special: the minimum can be computed directly. Stack the features in a matrix $X$ with a column of ones for the bias; then

$$
\boldsymbol{\theta} = \left(X^\top X\right)^{-1} X^\top \mathbf{y}
$$

```python
import numpy as np

rng = np.random.default_rng(0)
X = rng.uniform(0, 10, 50)                 # years of experience
y = 3.0 + 1.5 * X + rng.normal(0, 1.0, 50) # salary (LPA) with noise

# Normal equation, with a column of ones for the intercept
A = np.column_stack([np.ones_like(X), X])
b, w = np.linalg.solve(A.T @ A, A.T @ y)   # solve, don't invert
print(f"w = {w:.3f}, b = {b:.3f}")

y_hat = w * X + b
ss_res = np.sum((y - y_hat) ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
print(f"R^2 = {1 - ss_res / ss_tot:.3f}")
```

```output
w = 1.552, b = 2.757
R^2 = 0.954
```

The true relationship was $y = 1.5x + 3$ plus noise, and the fit recovers it closely.

| | Gradient descent | Normal equation |
|---|---|---|
| Cost | $O(k \cdot n d)$ for $k$ iterations | $O(n d^2 + d^3)$ |
| Many features (large $d$) | ✅ scales well | ❌ the $d^3$ solve gets slow |
| Hyperparameters | learning rate, iterations | none |
| Needs feature scaling | yes, for speed | no |
| Works for other models | yes (logistic, neural nets…) | only linear regression |

## With scikit-learn

```python
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, r2_score

rng = np.random.default_rng(0)
X = rng.uniform(0, 10, 50).reshape(-1, 1)   # 2-D: (n_samples, n_features)
y = 3.0 + 1.5 * X[:, 0] + rng.normal(0, 1.0, 50)

model = LinearRegression().fit(X, y)
pred = model.predict(X)
print(f"w = {model.coef_[0]:.3f}, b = {model.intercept_:.3f}")
print(f"MSE = {mean_squared_error(y, pred):.3f}, R^2 = {r2_score(y, pred):.3f}")
print(f"5 years -> {model.predict([[5.0]])[0]:.2f} LPA")
```

```output
w = 1.552, b = 2.757
MSE = 0.993, R^2 = 0.954
5 years -> 10.52 LPA
```

## Measuring the fit

- **MSE** — average squared error, in squared units of $y$.
- **RMSE** $= \sqrt{\text{MSE}}$ — back in the units of $y$ ("off by about 1 LPA").
- **MAE** — mean absolute error; less sensitive to outliers than MSE.
- **$R^2$** $= 1 - \dfrac{\sum (y_i - \hat{y}_i)^2}{\sum (y_i - \bar{y})^2}$ — the fraction of variance explained. $1$ is perfect, $0$ means "no better than always predicting the mean", and it can be negative on test data for a bad model.

## Assumptions (and what breaks them)

1. **Linearity** — the relationship really is (close to) linear. Curved data needs feature engineering (e.g. $x^2$) or a non-linear model.
2. **Independent errors** — residuals are not correlated (time series often violate this).
3. **Constant variance (homoscedasticity)** — the spread of residuals doesn't grow with $x$.
4. **Little multicollinearity** — highly correlated features make individual weights unstable (regularization helps, see [Regularization](/ml/regularization)).
5. For confidence intervals and p-values: roughly **normally distributed residuals**.

> [!WARNING]
> - Forgetting that `X` must be 2-D in scikit-learn: use `X.reshape(-1, 1)` for a single feature.
> - Reading a large weight as "important" when features are on different scales — compare weights only after standardizing.
> - Extrapolating far outside the training range: the line keeps going even where reality doesn't.
> - A learning rate that is too high makes gradient descent diverge (try it in the lab: push `lr` above 1).
> - Outliers pull the least-squares line hard because errors are squared.

## Interview questions

> [!INTERVIEW] Why squared error and not absolute error?
> Squared error is differentiable everywhere, gives a convex bowl with a closed-form solution, and corresponds to maximum likelihood under Gaussian noise. Absolute error (MAE) is more robust to outliers but has a kink at zero.

> [!INTERVIEW] Is linear regression a "linear" model if I add $x^2$ as a feature?
> Yes — "linear" refers to being linear in the **parameters** $w$, not in the input. $\hat{y} = w_1 x + w_2 x^2 + b$ is still fitted by linear regression (that is polynomial regression).

> [!INTERVIEW] When would you prefer gradient descent over the normal equation?
> When there are many features (the $d^3$ matrix solve becomes expensive), when data doesn't fit in memory (use mini-batches), or when $X^\top X$ is singular or ill-conditioned.

> [!REMEMBER]
> Model $\hat{y} = \mathbf{w}^\top\mathbf{x} + b$ · loss MSE · fit by gradient descent or the normal equation · evaluate with RMSE/MAE/$R^2$ · scale features · watch for outliers and extrapolation.
