A **decision tree** predicts by asking a sequence of yes/no questions about the features — "is $x_1 \le 5.5$?", then "is $x_2 \le 6.3$?" — until it reaches a leaf that holds the answer. Each question splits the feature space with an axis-aligned cut, so the final model is a set of boxes, each predicting one class (or value).

## How a tree is grown (CART)

Starting with all training data at the root:

1. For **every feature** and **every candidate threshold**, measure how pure the two resulting groups would be.
2. Pick the split that makes the children purest (largest impurity decrease).
3. **Recurse** on each child.
4. Stop when a node is pure, reaches `max_depth`, or has too few samples; the leaf predicts its majority class (classification) or mean value (regression).

This is a **greedy** algorithm: it picks the best split *now* without looking ahead, which is fast but not guaranteed to find the best possible tree (finding the optimal tree is NP-hard). The lab sweeps a candidate threshold across each feature and plots the weighted impurity — the dip is the chosen split.

## Measuring impurity

For a node where class $k$ has proportion $p_k$:

$$
\text{Gini} = 1 - \sum_k p_k^2
\qquad\qquad
\text{Entropy} = -\sum_k p_k \log_2 p_k
$$

Both are 0 for a pure node and largest when classes are evenly mixed (for two classes: Gini 0.5, entropy 1 bit). A split's quality is the impurity of the parent minus the **weighted** impurity of the children:

$$
\text{Gain} = I(\text{parent}) - \frac{n_L}{n} I(L) - \frac{n_R}{n} I(R)
$$

With entropy this is called **information gain**.

> [!TIP] Gini vs entropy
> They usually choose the same splits. Gini is slightly cheaper (no logarithm) and is scikit-learn's default; entropy has the information-theory interpretation.

```python
import numpy as np

def gini(y):
    p = np.bincount(y) / len(y)
    return 1 - np.sum(p ** 2)

def entropy(y):
    p = np.bincount(y) / len(y)
    p = p[p > 0]
    return -np.sum(p * np.log2(p))

y = np.array([0, 0, 0, 0, 1, 1, 1, 1, 1, 1])       # 4 vs 6
left, right = y[:5], y[5:]                         # a candidate split
weighted = (len(left) * gini(left) + len(right) * gini(right)) / len(y)
print(f"parent gini {gini(y):.3f}, entropy {entropy(y):.3f} bits")
print(f"children weighted gini {weighted:.3f} -> gain {gini(y) - weighted:.3f}")
```

```output
parent gini 0.480, entropy 0.971 bits
children weighted gini 0.160 -> gain 0.320
```

## Regression trees

Same procedure, but impurity is the **variance** (MSE) of the targets in a node, and leaves predict the mean. The result is a step function.

## Overfitting and pruning

An unconstrained tree keeps splitting until every leaf is pure — it memorises the training data (high variance). Control it with:

- **Pre-pruning** (stop early): `max_depth`, `min_samples_split`, `min_samples_leaf`, `max_leaf_nodes`, `min_impurity_decrease`.
- **Post-pruning**: grow fully, then cut back branches that don't help on validation data. scikit-learn implements **cost-complexity pruning** via `ccp_alpha`.

```python
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
from sklearn.tree import DecisionTreeClassifier

X, y = load_breast_cancer(return_X_y=True)
X_tr, X_te, y_tr, y_te = train_test_split(X, y, random_state=0)

for depth in [1, 3, None]:
    tree = DecisionTreeClassifier(max_depth=depth, random_state=0).fit(X_tr, y_tr)
    print(f"max_depth={str(depth):4s} leaves={tree.get_n_leaves():3d} "
          f"train={tree.score(X_tr, y_tr):.3f} test={tree.score(X_te, y_te):.3f}")
```

```output
max_depth=1    leaves=  2 train=0.923 test=0.881
max_depth=3    leaves=  8 train=0.977 test=0.937
max_depth=None leaves= 16 train=1.000 test=0.881
```

The unlimited tree is perfect on training data but not the best on the test set — overfitting in action.

## Reading a tree

```python
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier, export_text

iris = load_iris()
tree = DecisionTreeClassifier(max_depth=2, random_state=0).fit(iris.data, iris.target)
print(export_text(tree, feature_names=list(iris.feature_names)))
```

```output
|--- petal width (cm) <= 0.80
|   |--- class: 0
|--- petal width (cm) >  0.80
|   |--- petal width (cm) <= 1.75
|   |   |--- class: 1
|   |--- petal width (cm) >  1.75
|   |   |--- class: 2
```

## Strengths and weaknesses

| ✅ Strengths | ⚠️ Weaknesses |
|---|---|
| easy to visualise and explain | high variance — small data changes can produce a different tree |
| no feature scaling needed | greedy splits, axis-aligned boundaries (diagonal patterns need many steps) |
| handles numeric and categorical data, non-linear relations, interactions | biased toward features with many split points |
| fast prediction: $O(\text{depth})$ | poor extrapolation for regression |

Single trees are rarely the final model; their real power shows in **ensembles** — random forests and gradient boosting ([Ensemble Methods](/ml/ensemble-methods)).

> [!WARNING]
> - Leaving `max_depth=None` and celebrating 100% training accuracy.
> - Interpreting `feature_importances_` (impurity-based) as causal; it can favour high-cardinality features — prefer permutation importance for analysis.
> - Scaling features "just in case": harmless, but unnecessary for trees.

## Interview questions

> [!INTERVIEW] How does a decision tree choose a split?
> It tries every feature and threshold, computes the weighted impurity (Gini or entropy) of the two children, and picks the split with the largest impurity decrease — greedily, one node at a time.

> [!INTERVIEW] Why do decision trees overfit and how do you prevent it?
> They can keep splitting until each leaf holds a single sample. Limit depth or leaf size (pre-pruning), use cost-complexity pruning, or average many trees (random forest).

> [!INTERVIEW] Gini impurity of a node with classes split 50/50? 100/0?
> 50/50: $1 - (0.5^2 + 0.5^2) = 0.5$. 100/0: $1 - 1^2 = 0$.

> [!REMEMBER]
> Greedy recursive splits · Gini / entropy / variance · gain = parent − weighted children · prune (max_depth, min_samples_leaf, ccp_alpha) · no scaling needed · high variance → use ensembles.
