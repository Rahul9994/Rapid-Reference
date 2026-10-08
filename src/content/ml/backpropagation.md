**Backpropagation** is how neural networks compute the gradient of the loss with respect to *every* weight — efficiently, in one backward sweep. It is nothing more than the **chain rule** of calculus applied systematically on a computational graph, reusing intermediate results so the cost is about the same as a forward pass.

## The computational graph

Any formula can be broken into simple operations — nodes in a graph. The lab's single neuron with squared-error loss is:

$$
z = w_1 x_1 + w_2 x_2 + b, \qquad a = \sigma(z), \qquad L = (a - y)^2
$$

**Forward pass**: compute values left to right (the upper number in each lab node). **Backward pass**: compute gradients right to left (the ∇ numbers), starting from $\frac{\partial L}{\partial L} = 1$.

## The chain rule, step by step

Each node only needs its **local derivative** and the gradient arriving from above ("upstream"):

$$
\text{downstream gradient} = \text{upstream gradient} \times \text{local gradient}
$$

For the lab's graph:

$$
\begin{aligned}
\frac{\partial L}{\partial a} &= 2(a - y) \\
\frac{\partial L}{\partial z} &= \frac{\partial L}{\partial a}\cdot\frac{\partial a}{\partial z} = 2(a - y)\cdot a(1 - a) \\
\frac{\partial L}{\partial w_1} &= \frac{\partial L}{\partial z}\cdot x_1, \qquad
\frac{\partial L}{\partial w_2} = \frac{\partial L}{\partial z}\cdot x_2, \qquad
\frac{\partial L}{\partial b} = \frac{\partial L}{\partial z}
\end{aligned}
$$

## Patterns worth memorising

| Node | Forward | Backward rule |
|---|---|---|
| **Add** $z = x + y$ | sum | copies the upstream gradient to every input ("distributor") |
| **Multiply** $z = x \cdot y$ | product | each input gets upstream × the *other* input ("swapper") |
| **Max** $z = \max(x, y)$ | larger value | the larger input gets all of it ("router") — this is ReLU's rule |
| **Sigmoid** $a = \sigma(z)$ | squash | upstream × $a(1 - a)$ |
| **Tanh** $a = \tanh z$ | squash | upstream × $(1 - a^2)$ |
| **Branch** (a value used twice) | — | gradients from both uses **add up** |

## Verify with numbers (and a gradient check)

```python
import math

x1, x2, y = 1.5, -0.5, 1.0
w1, w2, b = -0.6, 0.9, 0.1

def forward(w1, w2, b):
    z = w1 * x1 + w2 * x2 + b
    a = 1 / (1 + math.exp(-z))
    return z, a, (a - y) ** 2

z, a, L = forward(w1, w2, b)
dL_da = 2 * (a - y)
dL_dz = dL_da * a * (1 - a)
grads = {"w1": dL_dz * x1, "w2": dL_dz * x2, "b": dL_dz}
print(f"z = {z:.3f}, a = {a:.4f}, L = {L:.4f}")
print({k: round(v, 4) for k, v in grads.items()})

# numerical check: (L(w + h) - L(w - h)) / 2h should match the analytic gradient
h = 1e-5
numeric_w1 = (forward(w1 + h, w2, b)[2] - forward(w1 - h, w2, b)[2]) / (2 * h)
print(f"analytic dL/dw1 = {grads['w1']:.6f}, numerical = {numeric_w1:.6f}")
```

```output
z = -1.250, a = 0.2227, L = 0.6042
{'w1': -0.4037, 'w2': 0.1346, 'b': -0.2691}
analytic dL/dw1 = -0.403663, numerical = -0.403663
```

The numerical **gradient check** is how you debug a hand-written backward pass.

## In matrix form (one dense layer)

For $Z = XW + \mathbf{b}$ with upstream gradient $\frac{\partial L}{\partial Z}$ (shape $n \times k$):

$$
\frac{\partial L}{\partial W} = X^\top \frac{\partial L}{\partial Z}, \qquad
\frac{\partial L}{\partial \mathbf{b}} = \sum_{\text{rows}} \frac{\partial L}{\partial Z}, \qquad
\frac{\partial L}{\partial X} = \frac{\partial L}{\partial Z} W^\top
$$

The last one is the upstream gradient for the previous layer — that's how the error "propagates back". These are exactly the lines in the [Neural Networks](/ml/neural-networks) lab code. A handy check: every gradient has the same shape as the thing it is the gradient of.

## Why it matters: vanishing and exploding gradients

The gradient reaching an early layer is a **product** of many local gradients. If they are mostly below 1 (sigmoid's slope is at most 0.25), the product shrinks exponentially with depth — early layers barely learn (**vanishing gradients**). If they are mostly above 1, it blows up (**exploding gradients**). Remedies: ReLU activations, good initialisation, normalisation layers, residual (skip) connections, and gradient clipping.

## Automatic differentiation

Frameworks (PyTorch `loss.backward()`, TensorFlow `GradientTape`, JAX `grad`) record the computational graph during the forward pass and run backpropagation automatically — **reverse-mode autodiff**. It is efficient for neural networks because there is one scalar loss and millions of parameters.

> [!WARNING]
> - Forgetting that gradients from multiple uses of a variable must be **summed**.
> - Shape mismatches in matrix gradients — check every gradient's shape equals its variable's shape.
> - Not zeroing accumulated gradients between steps in PyTorch (`optimizer.zero_grad()`).
> - Confusing backpropagation (computing gradients) with gradient descent (using them to update weights).

## Interview questions

> [!INTERVIEW] Explain backpropagation.
> After a forward pass, start from the loss and move backwards through the computational graph, multiplying each node's local derivative by the gradient flowing into it (chain rule). This gives the loss gradient for every parameter in roughly the cost of one forward pass; an optimizer then uses those gradients.

> [!INTERVIEW] What is the vanishing gradient problem?
> In deep networks, gradients are products of many per-layer derivatives; with saturating activations those are small, so gradients for early layers become tiny and those layers stop learning. ReLU, residual connections, normalisation and good initialisation mitigate it.

> [!INTERVIEW] How do you verify a backprop implementation?
> Gradient checking: compare analytic gradients with centred finite differences $\frac{L(\theta + h) - L(\theta - h)}{2h}$ on a few parameters.

> [!REMEMBER]
> Forward computes values, backward computes gradients · downstream = upstream × local · add distributes, multiply swaps, max routes, branches sum · vanishing/exploding gradients · autodiff does it for you.
