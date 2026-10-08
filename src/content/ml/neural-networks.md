A **neural network** (multi-layer perceptron, MLP) stacks layers of neurons so that each layer transforms the previous layer's output. With non-linear activations, even one hidden layer can carve the input space into curved regions — the lab trains a real network in your browser to separate circles, moons and XOR, which no straight line can do.

## Architecture

```diagram A 2 → 4 → 1 network: every neuron connects to every neuron in the next layer
 input layer      hidden layer       output
   x₁ ●───────────●  h₁ ─╮
        ╲ ╱  ╲ ╱  ●  h₂ ─┼──────►  ● ŷ
        ╱ ╲  ╱ ╲  ●  h₃ ─┤
   x₂ ●───────────●  h₄ ─╯
```

- **Input layer** — one node per feature (no computation).
- **Hidden layers** — learn intermediate features. "Deep" learning = many hidden layers.
- **Output layer** — 1 sigmoid unit (binary), $K$ softmax units (multi-class), or a linear unit (regression).

Each layer is a matrix multiply plus bias, then an activation. The number of parameters of a dense layer with $m$ inputs and $k$ outputs is $m \cdot k + k$.

## Forward propagation

For a batch $X$ of shape $(n, d)$:

$$
\begin{aligned}
Z^{[1]} &= X W^{[1]} + \mathbf{b}^{[1]}, & A^{[1]} &= \tanh\big(Z^{[1]}\big) \\
Z^{[2]} &= A^{[1]} W^{[2]} + \mathbf{b}^{[2]}, & \hat{\mathbf{y}} &= \sigma\big(Z^{[2]}\big)
\end{aligned}
$$

In the lab, each small square inside a hidden node shows what that neuron computes over the whole input plane — a soft line, $\tanh(w_1x_1 + w_2x_2 + b)$. The output neuron combines these lines into a curved boundary.

## Training

1. **Forward pass** — compute predictions.
2. **Loss** — e.g. binary cross-entropy.
3. **Backward pass** — compute every weight's gradient with the chain rule ([Backpropagation](/ml/backpropagation)).
4. **Update** — a gradient-descent step (often Adam).

Repeat over many epochs of mini-batches.

```python
import numpy as np
from sklearn.datasets import make_circles

X, y = make_circles(n_samples=300, noise=0.08, factor=0.45, random_state=0)
y = y.reshape(-1, 1)
rng = np.random.default_rng(0)
H, lr, n = 8, 1.0, len(X)
W1, b1 = rng.normal(0, 1, (2, H)), np.zeros(H)
W2, b2 = rng.normal(0, 1, (H, 1)), np.zeros(1)

for epoch in range(2000):
    A1 = np.tanh(X @ W1 + b1)                      # forward
    p = 1 / (1 + np.exp(-(A1 @ W2 + b2)))
    dZ2 = (p - y) / n                              # backward
    dW2, db2 = A1.T @ dZ2, dZ2.sum(0)
    dZ1 = dZ2 @ W2.T * (1 - A1 ** 2)
    dW1, db1 = X.T @ dZ1, dZ1.sum(0)
    W1 -= lr * dW1; b1 -= lr * db1                 # update
    W2 -= lr * dW2; b2 -= lr * db2

loss = -np.mean(y * np.log(p) + (1 - y) * np.log(1 - p))
print(f"loss {loss:.4f}, training accuracy {np.mean((p > 0.5) == y):.3f}")
```

```output
loss 0.0062, training accuracy 1.000
```

## With scikit-learn

```python
from sklearn.datasets import make_moons
from sklearn.model_selection import train_test_split
from sklearn.neural_network import MLPClassifier
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

X, y = make_moons(n_samples=500, noise=0.25, random_state=0)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)
mlp = make_pipeline(StandardScaler(),
                    MLPClassifier(hidden_layer_sizes=(16, 16), activation="relu",
                                  alpha=1e-3, max_iter=2000, random_state=0))
mlp.fit(X_tr, y_tr)
print(f"test accuracy {mlp.score(X_te, y_te):.3f}")
```

```output
test accuracy 0.912
```

For real deep learning (GPUs, CNNs, transformers) use **PyTorch** or **TensorFlow/Keras**; the concepts are identical.

## Universal approximation

A network with a single hidden layer and enough neurons can approximate any continuous function on a bounded region as closely as you like. In practice, **deeper** networks reach the same accuracy with far fewer neurons, because each layer builds on the features of the last (edges → shapes → objects).

## Making training work

| Problem | Tools |
|---|---|
| Vanishing / exploding gradients | ReLU-family activations, careful initialisation (He / Xavier), batch/layer normalisation, residual connections, gradient clipping |
| Overfitting | more data, data augmentation, dropout, L2 weight decay, early stopping |
| Slow or unstable optimisation | Adam, learning-rate schedules, feature scaling, batch normalisation |
| Symmetry | random (not zero) weight initialisation — identical weights make all neurons learn the same thing |

**Hyperparameters**: number of layers and units, activation, learning rate (most important), batch size, epochs, regularisation strength, optimizer.

> [!WARNING]
> - Initialising all weights to zero.
> - Not scaling inputs.
> - Using sigmoid in deep hidden layers.
> - Ignoring the validation curve — training loss always goes down; watch for the point where validation loss turns up.
> - Reaching for a neural net on small tabular data where gradient boosting usually wins.

## Interview questions

> [!INTERVIEW] Why do neural networks need non-linear activation functions?
> Without them, any number of layers collapses into a single linear transformation, so the network could only learn linear boundaries.

> [!INTERVIEW] What is the difference between an epoch, a batch and an iteration?
> A batch is the subset of examples used for one update; an iteration is one update; an epoch is one full pass over the training set (= $n$ / batch size iterations).

> [!INTERVIEW] What does dropout do?
> During training it randomly zeroes a fraction of activations each step, so neurons can't rely on specific partners — a form of regularisation like training an ensemble of thinned networks. It is turned off at inference.

> [!REMEMBER]
> Layers = matrix multiply + bias + activation · forward → loss → backprop → update · non-linearity is essential · ReLU + Adam + scaling + regularisation · random init · depth builds hierarchical features.
