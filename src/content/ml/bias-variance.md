Every model makes a trade: too simple and it can't capture the pattern; too flexible and it memorises the noise. The **bias–variance trade-off** explains why training error alone is a terrible guide, and why we always judge models on data they have not seen.

## Underfitting vs overfitting

| | Underfitting | Good fit | Overfitting |
|---|---|---|---|
| Model | too simple | right complexity | too complex |
| Training error | high | low | very low (≈ 0) |
| Test error | high | low | high |
| Main problem | high **bias** | balanced | high **variance** |
| Lab example | degree 1 line | degree 3–5 | degree 11 wiggles |

In the lab, the training error keeps falling as the polynomial degree grows, but the **test** error falls, bottoms out, then rises — the classic U-shape.

## What bias and variance mean

Imagine re-collecting the training data many times and retraining the same model each time.

- **Bias** — how far the *average* prediction is from the truth. A straight line fit to a sine wave is wrong in a systematic way no matter what data it sees.
- **Variance** — how much the prediction *jumps around* between those retrainings. A degree-11 polynomial changes shape completely when one point moves.

For squared error, the expected test error at a point decomposes exactly as:

$$
\mathbb{E}\big[(y - \hat{f}(x))^2\big] = \underbrace{\big(\mathbb{E}[\hat{f}(x)] - f(x)\big)^2}_{\text{bias}^2} + \underbrace{\mathbb{E}\big[(\hat{f}(x) - \mathbb{E}[\hat{f}(x)])^2\big]}_{\text{variance}} + \underbrace{\sigma^2}_{\text{irreducible noise}}
$$

The noise term $\sigma^2$ can't be removed by any model. Increasing complexity usually lowers bias and raises variance; the sweet spot minimises their sum.

## Seeing it in code

```python
import numpy as np

rng = np.random.default_rng(1)
f = lambda x: np.sin(2 * np.pi * x)
x_train = np.sort(rng.uniform(0, 1, 15))
y_train = f(x_train) + rng.normal(0, 0.25, 15)
x_test = rng.uniform(x_train.min(), x_train.max(), 200)   # no extrapolation
y_test = f(x_test) + rng.normal(0, 0.25, 200)

for degree in [1, 3, 6, 12]:
    model = np.poly1d(np.polyfit(x_train, y_train, degree))
    train = np.mean((model(x_train) - y_train) ** 2)
    test = np.mean((model(x_test) - y_test) ** 2)
    print(f"degree {degree:2d}: train MSE {train:.3f}   test MSE {test:.3f}")
```

```output
degree  1: train MSE 0.271   test MSE 0.235
degree  3: train MSE 0.057   test MSE 0.061
degree  6: train MSE 0.042   test MSE 0.095
degree 12: train MSE 0.009   test MSE 14713.804
```

Degree 1 underfits (both errors high), degree 3 is the sweet spot, and degree 12 threads almost exactly through the 15 training points while swinging wildly between them — its test error explodes.

## How to diagnose

**Learning curves** plot training and validation error against the amount of training data:

- **High bias**: both errors are high and close together. More data won't help — add features or use a more flexible model.
- **High variance**: a big gap — low training error, high validation error. More data, regularization or a simpler model will help.

## How to fix

| To reduce **bias** (underfitting) | To reduce **variance** (overfitting) |
|---|---|
| more flexible model (higher degree, deeper tree, bigger network) | get more training data |
| add informative features | regularization: L2 / L1 ([Regularization](/ml/regularization)), dropout |
| reduce regularization | simpler model / fewer features |
| train longer (neural nets) | early stopping |
| boosting ([Ensembles](/ml/ensemble-methods)) | bagging / random forests ([Ensembles](/ml/ensemble-methods)) |
| | data augmentation (images, text) |

> [!TIP] Different algorithms, different defaults
> Linear regression and shallow trees lean towards high bias. Deep trees, KNN with $k = 1$ and huge networks lean towards high variance. Hyperparameters like tree depth, $k$, and regularization strength slide a model along the trade-off.

> [!NOTE] Double descent
> Very large modern networks can show "double descent": test error rises near the point where the model can exactly interpolate the training data, then falls again as the model grows further. The classic U-curve is still the right mental model for most classical ML.

> [!WARNING]
> - Choosing model complexity by **training** error — it always prefers the most complex model.
> - Tuning on the test set until it looks good: you have overfitted to the test set.
> - Assuming more data fixes everything — it does not cure high bias.
> - Confusing the statistical meaning of "bias" here with societal bias in [AI fairness](/ai/ai-ethics).

## Interview questions

> [!INTERVIEW] What is the bias–variance trade-off?
> Expected error = bias² + variance + irreducible noise. Simple models have high bias (systematically wrong), complex models have high variance (sensitive to the particular training sample). Good models balance the two, which we find using validation data.

> [!INTERVIEW] Your model has 99% training accuracy and 70% test accuracy. What do you do?
> That's overfitting (high variance). Get more data or augment it, add regularization, reduce model complexity, use early stopping, use bagging, and check for leakage or train/test distribution differences.

> [!INTERVIEW] Does k-fold cross-validation reduce variance of the model?
> No — it reduces the variance of the *performance estimate* by averaging over several splits. It helps you *choose* a model with a good trade-off.

> [!REMEMBER]
> Underfit = high bias (both errors high) · overfit = high variance (big train–test gap) · pick complexity on validation data · more data helps variance, not bias.
