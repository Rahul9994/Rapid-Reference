**Gradient descent** is the workhorse optimizer of machine learning. Given a loss $J(\mathbf{w})$ that measures how wrong the model is, it repeatedly nudges the parameters a little bit **downhill** until the loss stops improving. Linear regression, logistic regression and every neural network are trained this way.

## The idea

The **gradient** $\nabla J(\mathbf{w})$ is the vector of partial derivatives — it points in the direction of steepest *increase*. So we step the opposite way:

$$
\mathbf{w} \leftarrow \mathbf{w} - \alpha\, \nabla J(\mathbf{w})
$$

$\alpha$ is the **learning rate**: how big each step is. In the lab, the contours are lines of equal loss, the ball is $\mathbf{w}$, and the arrow is the step $-\alpha \nabla J$.

> [!TIP] Hiking in fog
> You can only feel the slope under your feet. Take a step in the steepest downhill direction, feel again, repeat. Small steps are safe but slow; giant steps can jump straight over the valley.

## Choosing the learning rate

| Learning rate | What happens |
|---|---|
| Too small | converges, but painfully slowly |
| Just right | fast, steady decrease of the loss |
| Too large | zig-zags across the valley, may oscillate forever |
| Way too large | **diverges** — the loss explodes |

For a quadratic bowl $J = \tfrac{1}{2}\mathbf{w}^\top A\mathbf{w}$, plain gradient descent is stable only when $\alpha < 2/\lambda_{\max}$, where $\lambda_{\max}$ is the largest eigenvalue (the steepest curvature) of $A$. In the lab, $\lambda_{\max} \approx 3.56$, so anything above $\alpha \approx 0.56$ diverges — try it.

## Why elongated valleys are slow

When one direction is much steeper than another (high *condition number* $\lambda_{\max}/\lambda_{\min}$), a learning rate small enough for the steep direction crawls along the flat one, and the path zig-zags. Two fixes:

1. **Scale your features** so the bowl is rounder ([Data Preprocessing](/ml/data-preprocessing)).
2. Use **momentum** or an adaptive optimizer.

## Batch, stochastic and mini-batch

The true gradient averages over all $n$ training examples. How many examples you use per step defines the variant:

| Variant | Examples per step | Pros | Cons |
|---|---|---|---|
| **Batch GD** | all $n$ | exact gradient, smooth path | each step is expensive on big data |
| **Stochastic GD (SGD)** | 1 | very cheap steps, can escape shallow minima | noisy path, needs a decaying learning rate |
| **Mini-batch GD** | e.g. 32–512 | best of both, vectorizes well on GPUs | one more hyperparameter (batch size) |

In deep learning, "SGD" almost always means mini-batch SGD. One full pass over the training data is an **epoch**.

```python
import numpy as np

rng = np.random.default_rng(42)
X = rng.normal(size=(1000, 3))
true_w = np.array([2.0, -1.0, 0.5])
y = X @ true_w + 0.1 * rng.normal(size=1000)

def minibatch_gd(X, y, lr=0.1, epochs=20, batch=32):
    w = np.zeros(X.shape[1])
    n = len(X)
    for epoch in range(epochs):
        idx = rng.permutation(n)                 # shuffle every epoch
        for start in range(0, n, batch):
            b = idx[start:start + batch]
            grad = 2 / len(b) * X[b].T @ (X[b] @ w - y[b])
            w -= lr * grad
    return w

print(np.round(minibatch_gd(X, y), 3))
```

```output
[ 1.997 -0.996  0.511]
```

## Momentum

Momentum keeps a running "velocity" — an exponentially decaying sum of past gradients — so consistent directions accelerate and oscillating ones cancel out:

$$
\mathbf{v} \leftarrow \beta\,\mathbf{v} + \nabla J(\mathbf{w}), \qquad \mathbf{w} \leftarrow \mathbf{w} - \alpha\,\mathbf{v}
$$

with $\beta \approx 0.9$. In the lab, momentum races along the valley but can overshoot and spiral before settling.

## Adaptive optimizers

- **AdaGrad** — per-parameter learning rates that shrink for frequently-updated parameters.
- **RMSProp** — like AdaGrad but with a moving average, so the rate doesn't decay to zero.
- **Adam** — momentum + RMSProp-style scaling, with bias correction. A strong default for neural networks:

$$
\begin{aligned}
\mathbf{m} &\leftarrow \beta_1 \mathbf{m} + (1-\beta_1)\,\mathbf{g} \\
\mathbf{s} &\leftarrow \beta_2 \mathbf{s} + (1-\beta_2)\,\mathbf{g}^2 \\
\mathbf{w} &\leftarrow \mathbf{w} - \alpha\,\frac{\hat{\mathbf{m}}}{\sqrt{\hat{\mathbf{s}}} + \epsilon}
\end{aligned}
$$

where $\hat{\mathbf{m}}, \hat{\mathbf{s}}$ are bias-corrected, and the usual defaults are $\beta_1 = 0.9$, $\beta_2 = 0.999$, $\epsilon = 10^{-8}$.

## Learning-rate schedules

Large steps early, small steps late: **step decay**, **exponential decay**, **cosine annealing**, and **warm-up** (start small, ramp up — common for transformers).

## Convex vs non-convex losses

For **convex** losses (linear regression's MSE, logistic regression's log-loss) any local minimum is the global minimum, so gradient descent with a suitable learning rate finds the best solution. Neural network losses are **non-convex**: they have many local minima and saddle points. In practice, in high dimensions saddle points and flat regions are the bigger obstacle, and the noise of mini-batch SGD helps escape them.

## When to stop

- A fixed number of epochs, or
- the loss improvement drops below a tolerance, or
- **early stopping** — validation loss stops improving for a few epochs (also a regularizer).

> [!WARNING]
> - Not shuffling data between epochs in SGD (ordered data biases the updates).
> - Forgetting feature scaling, then blaming the learning rate.
> - Tuning the learning rate on a linear scale — try a log grid: 0.001, 0.003, 0.01, 0.03, 0.1…
> - Watching only training loss: a falling training loss with a rising validation loss means overfitting.
> - Exploding loss (`nan`): learning rate too high, or numerically unstable code (e.g. `log(0)`).

## Interview questions

> [!INTERVIEW] What is the difference between batch, stochastic and mini-batch gradient descent?
> They differ in how many examples estimate the gradient per update: all of them (exact but slow per step), one (cheap but noisy), or a small batch (the practical compromise that also uses hardware parallelism well).

> [!INTERVIEW] Why can a high learning rate make the loss go up?
> The gradient is only a local, linear view of the loss. A big step overshoots the minimum and lands higher up the other side of the valley; if each overshoot is larger than the last, training diverges.

> [!INTERVIEW] What does momentum fix?
> Oscillation in steep directions and slow progress in shallow ones. Averaging gradients over time cancels the zig-zag and builds speed along consistent directions.

> [!REMEMBER]
> $\mathbf{w} \leftarrow \mathbf{w} - \alpha\nabla J$ · learning rate is the most important hyperparameter · scale features · mini-batch SGD + momentum/Adam in practice · use early stopping and watch validation loss.
