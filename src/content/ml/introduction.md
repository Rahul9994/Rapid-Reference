**Machine learning (ML)** is the practice of building programs that learn a behaviour from **data** instead of being given explicit rules. Instead of writing `if petal_length < 2.5: return "setosa"`, you show the program labelled examples and let an algorithm find the rule — and, ideally, rules that still work on examples it has never seen.

> [!NOTE] A working definition
> Tom Mitchell's classic definition (1997): a program learns from experience **E** with respect to a task **T** and performance measure **P** if its performance at T, measured by P, improves with E. For spam filtering: T = classify emails, P = accuracy, E = a mailbox of emails labelled spam / not spam.

## Traditional programming vs machine learning

```diagram Rules in, answers out — versus examples in, rules out
Traditional:   data + rules (hand-written)   ──►  answers
ML:            data + answers (labels)       ──►  rules (a trained model)
               new data + model              ──►  predictions
```

ML shines when the rules are too complex to write by hand (recognising faces), keep changing (fraud patterns), or need to be personalised (recommendations).

## The three main types of learning

| Type | What the data looks like | Goal | Examples |
|---|---|---|---|
| **Supervised** | inputs **with** labels $(x, y)$ | learn $x \mapsto y$ | spam detection, house prices, diagnosis |
| **Unsupervised** | inputs **without** labels | find structure | customer segments, anomaly detection, compression |
| **Reinforcement** | an agent acting in an environment, receiving **rewards** | learn a policy that maximises reward | game playing, robotics, recommendations |

Supervised learning splits further by the kind of label:

- **Regression** — predict a number (price, temperature). See [Linear Regression](/ml/linear-regression).
- **Classification** — predict a category (spam / not spam, digit 0–9). See [Logistic Regression](/ml/logistic-regression).

You will also hear **semi-supervised** (a few labels, lots of unlabelled data) and **self-supervised** learning (labels are created from the data itself — e.g. predicting the next word, which is how large language models are pre-trained).

## The ML workflow

The lab at the top walks through every step on the real Iris dataset:

1. **Define the problem** — what is predicted, and how success is measured.
2. **Collect data** — and check its quality and representativeness.
3. **Split** — hold back a test set *before* looking closely at the data.
4. **Preprocess** — handle missing values, encode categories, scale features. See [Data Preprocessing](/ml/data-preprocessing).
5. **Train** — fit a model's parameters on the training set.
6. **Validate & tune** — choose hyperparameters with a validation set or cross-validation. See [Cross-Validation](/ml/cross-validation).
7. **Evaluate** — measure once on the untouched test set. See [Evaluation Metrics](/ml/evaluation-metrics).
8. **Deploy & monitor** — real-world data drifts; models need retraining.

```python
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score

X, y = load_iris(return_X_y=True)
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=1)

scaler = StandardScaler().fit(X_train)          # fit on training data only
model = LogisticRegression().fit(scaler.transform(X_train), y_train)
y_pred = model.predict(scaler.transform(X_test))

print(X_train.shape, X_test.shape)
print(f"test accuracy: {accuracy_score(y_test, y_pred):.4f}")
```

```output
(120, 4) (30, 4)
test accuracy: 0.9667
```

## Key vocabulary

| Term | Meaning |
|---|---|
| **Feature** | an input variable (petal length) — a column of $X$ |
| **Label / target** | what we predict (species) — $y$ |
| **Sample / instance** | one row (one flower) |
| **Model** | a function with parameters, e.g. $\hat{y} = \mathbf{w}^\top\mathbf{x} + b$ |
| **Parameters** | learned from data (weights $w$, bias $b$) |
| **Hyperparameters** | chosen by you before training (learning rate, $k$ in KNN, tree depth) |
| **Loss function** | how wrong one prediction is (squared error, log-loss) |
| **Training** | adjusting parameters to minimise the loss |
| **Inference** | using the trained model to predict |
| **Generalisation** | performing well on unseen data — the real goal |

## Overfitting and underfitting in one line

A model that is too simple misses the pattern (**underfitting**, high bias); one that is too flexible memorises noise (**overfitting**, high variance). The whole art of ML is landing in between — see [Bias–Variance & Overfitting](/ml/bias-variance).

> [!WARNING]
> - Evaluating on the training data and calling it "accuracy" — always use held-out data.
> - **Data leakage**: letting test information influence training (e.g. fitting a scaler on the full dataset, or features that encode the answer).
> - Chasing a fancy model before establishing a simple **baseline** (predict the mean / most common class).
> - Ignoring class imbalance: 99% accuracy is meaningless if 99% of emails are not spam.

## Interview questions

> [!INTERVIEW] What is the difference between AI, ML and deep learning?
> AI is the broad goal of machines performing tasks that need intelligence. ML is a subset of AI where behaviour is learned from data. Deep learning is a subset of ML that uses multi-layer neural networks. See [What is AI?](/ai/introduction).

> [!INTERVIEW] Parameters vs hyperparameters?
> Parameters are learned during training (weights, biases, split thresholds). Hyperparameters are set before training and control the learning process or model capacity (learning rate, regularisation strength, number of trees, $k$).

> [!INTERVIEW] Why do we need a separate test set?
> Training error is optimistic — the model has seen those answers. A test set the model never influenced estimates performance on new data. If you tune on it repeatedly, it stops being an unbiased estimate, which is why validation sets / cross-validation exist.

> [!REMEMBER]
> Supervised (labels: regression or classification) · unsupervised (structure) · reinforcement (rewards). Workflow: split → preprocess (fit on train) → train → tune on validation → evaluate once on test.
