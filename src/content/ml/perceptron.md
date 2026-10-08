The **perceptron** (Frank Rosenblatt, 1958) is the simplest artificial neuron: it weighs its inputs, adds a bias, and fires if the total is positive. Stack many of them with smooth activation functions and you get a neural network — so understanding one neuron is the key to everything in deep learning.

## The artificial neuron

```diagram Inputs are weighted, summed, and passed through an activation
 x₁ ──w₁──╮
 x₂ ──w₂──┼──►  z = Σ wᵢxᵢ + b  ──►  activation f(z)  ──►  output
 x₃ ──w₃──╯            ▲
                       b (bias)
```

$$
z = \mathbf{w}^\top\mathbf{x} + b, \qquad \hat{y} = f(z)
$$

The classic perceptron uses a **step** activation: output $+1$ if $z > 0$, otherwise $-1$. Geometrically, $\mathbf{w}^\top\mathbf{x} + b = 0$ is a line (hyperplane) and $\mathbf{w}$ points toward the $+1$ side — the arrow in the lab.

## The perceptron learning rule

Go through the training points; whenever one is misclassified ($y_i(\mathbf{w}^\top\mathbf{x}_i + b) \le 0$), nudge the boundary toward it:

$$
\mathbf{w} \leftarrow \mathbf{w} + \eta\, y_i\, \mathbf{x}_i, \qquad b \leftarrow b + \eta\, y_i
$$

Correctly classified points cause no update. Repeat epochs until an epoch has zero mistakes.

```python
import numpy as np

def perceptron(X, y, lr=1.0, epochs=50):
    w, b = np.zeros(X.shape[1]), 0.0
    for epoch in range(epochs):
        mistakes = 0
        for xi, yi in zip(X, y):                 # yi is -1 or +1
            if yi * (xi @ w + b) <= 0:
                w += lr * yi * xi
                b += lr * yi
                mistakes += 1
        if mistakes == 0:
            return w, b, epoch + 1
    return w, b, epochs

# logical AND: only (1, 1) is positive — linearly separable
X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]])
y = np.array([-1, -1, -1, 1])
w, b, epochs = perceptron(X, y)
print(f"w = {w}, b = {b}, converged after {epochs} epochs")
print("predictions:", np.sign(X @ w + b).astype(int))
```

```output
w = [3. 2.], b = -4.0, converged after 9 epochs
predictions: [-1 -1 -1  1]
```

> [!IMPORTANT] Convergence theorem
> If the data is **linearly separable**, the perceptron is guaranteed to find a separating line in a finite number of updates (bounded by $(R/\gamma)^2$, where $R$ is the data radius and $\gamma$ the margin). If it is **not** separable, it never stops updating.

## The XOR problem

XOR (output 1 when exactly one input is 1) cannot be separated by any single line, so a single perceptron can't learn it. Minsky and Papert's 1969 book *Perceptrons* highlighted this limitation, which contributed to a long slump in neural-network research. The fix is **multiple layers** with non-linear activations — a hidden layer can carve the plane into regions that a final neuron combines. See [Neural Networks](/ml/neural-networks).

## Activation functions

A step function has zero gradient almost everywhere, so it can't be trained with gradient descent. Modern neurons use smooth (or piecewise-linear) activations. Watch how each one's slope — the gradient that backpropagation multiplies by — behaves:

```viz activations Each activation f(x) with its derivative f′(x) — the factor gradients are multiplied by in backprop.
```

| Activation | Formula | Range | Notes |
|---|---|---|---|
| Sigmoid | $\frac{1}{1+e^{-x}}$ | $(0, 1)$ | output layer for binary probabilities; saturates → vanishing gradients (max slope 0.25) |
| Tanh | $\tanh x$ | $(-1, 1)$ | zero-centred; still saturates |
| **ReLU** | $\max(0, x)$ | $[0, \infty)$ | default for hidden layers; cheap; "dying ReLU" if a unit is stuck negative |
| Leaky ReLU | $x$ if $x>0$ else $a x$ | $\mathbb{R}$ | small slope (e.g. 0.01) keeps negative units alive |
| GELU / SiLU | smooth ReLU-like curves | | common in transformers |
| Softmax | $\frac{e^{z_k}}{\sum_j e^{z_j}}$ | probabilities summing to 1 | output layer for multi-class |

> [!NOTE] Why non-linearity at all?
> Without it, stacking layers is pointless: a composition of linear functions is still linear, so a 10-layer network would be equivalent to one layer.

## Perceptron vs logistic regression

Same linear score $\mathbf{w}^\top\mathbf{x} + b$. The perceptron uses a hard step and updates only on mistakes; logistic regression uses the sigmoid, outputs probabilities and minimises log-loss with gradient descent — it is a "soft" perceptron.

> [!WARNING]
> - Expecting a single perceptron to learn XOR or any non-linear boundary.
> - Running it on non-separable data without an epoch limit (it never converges).
> - Using sigmoid/tanh in deep hidden layers and wondering why early layers don't learn (vanishing gradients) — prefer ReLU-family activations.

## Interview questions

> [!INTERVIEW] What is a perceptron?
> A single neuron computing a weighted sum plus bias followed by a step function — a linear binary classifier trained with the update $\mathbf{w} \leftarrow \mathbf{w} + \eta y\mathbf{x}$ on mistakes.

> [!INTERVIEW] Why can't a perceptron learn XOR?
> XOR's positive and negative points can't be separated by one straight line, and a perceptron can only draw one line. A hidden layer fixes it.

> [!INTERVIEW] Why is ReLU preferred over sigmoid in hidden layers?
> Its gradient is 1 for positive inputs, so gradients don't shrink layer after layer (no saturation there); it is also cheap to compute. Sigmoid's maximum gradient is 0.25 and it saturates at both ends.

> [!REMEMBER]
> $z = \mathbf{w}^\top\mathbf{x} + b$ → activation · update on mistakes: $\mathbf{w} \mathrel{+}= \eta y\mathbf{x}$ · converges iff linearly separable · XOR needs layers · ReLU for hidden layers, sigmoid/softmax for outputs.
