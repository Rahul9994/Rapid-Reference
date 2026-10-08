Real data is messy: values are missing, categories are text, and features live on wildly different scales. **Preprocessing** turns raw columns into a clean numeric matrix a model can learn from. It often matters more than the choice of algorithm.

## 1. Handling missing values

| Strategy | When it fits |
|---|---|
| **Drop rows** | few rows affected, data plentiful |
| **Drop the column** | the feature is mostly empty |
| **Impute mean / median** | numeric features; median is robust to outliers |
| **Impute most frequent** | categorical features |
| **Add a "was missing" flag** | missingness itself carries information |
| **Model-based imputation** (KNN, iterative) | when features are strongly related |

```python
import numpy as np
from sklearn.impute import SimpleImputer

X = np.array([[25, 50_000], [32, np.nan], [np.nan, 72_000], [41, 64_000]])
imputer = SimpleImputer(strategy="median")
print(imputer.fit_transform(X).astype(int))   # medians: 32 and 64000
```

```output
[[   25 50000]
 [   32 64000]
 [   32 72000]
 [   41 64000]]
```

## 2. Encoding categorical features

Models need numbers. Two common encodings:

- **One-hot encoding** — one binary column per category. Use for *nominal* categories with no order (city, colour).
- **Ordinal encoding** — map ordered categories to integers (`low < medium < high`). Using it on unordered categories invents a fake order.

```python
import pandas as pd

df = pd.DataFrame({"city": ["Delhi", "Pune", "Delhi", "Chennai"],
                   "size": ["S", "L", "M", "S"]})
df["size"] = df["size"].map({"S": 0, "M": 1, "L": 2})   # ordinal
print(pd.get_dummies(df, columns=["city"], dtype=int))  # one-hot
```

```output
   size  city_Chennai  city_Delhi  city_Pune
0     0             0           1          0
1     2             0           0          1
2     1             0           1          0
3     0             1           0          0
```

> [!TIP]
> High-cardinality categories (thousands of user IDs) explode one-hot encoding. Options: group rare categories into "other", target/frequency encoding (with care to avoid leakage), or learned embeddings.

## 3. Feature scaling

Many algorithms compare features numerically — distances in [KNN](/ml/knn) and [k-means](/ml/k-means), dot products in [SVMs](/ml/svm), gradient steps in [gradient descent](/ml/gradient-descent). If salary ranges over 20–200 and experience over 0–15, salary dominates simply because its numbers are bigger. The lab shows this: the query's nearest neighbour changes once features are scaled.

**Min-max scaling** squeezes each feature into $[0, 1]$:

$$
x' = \frac{x - x_{\min}}{x_{\max} - x_{\min}}
$$

**Standardization (z-score)** centres each feature at 0 with unit standard deviation:

$$
z = \frac{x - \mu}{\sigma}
$$

| | Min-max | Standardization |
|---|---|---|
| Output range | $[0, 1]$ | unbounded, mostly $[-3, 3]$ |
| Sensitive to outliers | very (one outlier squashes the rest) | less |
| Typical use | images (pixels), bounded features, neural-net inputs | linear models, SVM, PCA, KNN, gradient descent |

**Robust scaling** uses the median and interquartile range instead — best when outliers are present.

> [!IMPORTANT] Who needs scaling?
> Distance- and gradient-based models do: KNN, k-means, SVM, PCA, linear/logistic regression with regularization, neural networks. **Tree-based models** (decision trees, random forests, gradient boosting) split on one feature at a time and are unaffected by monotonic scaling.

## 4. Avoiding data leakage

**Leakage** is when information from outside the training set sneaks into training, producing optimistic scores that collapse in production. The most common form: computing statistics (mean, std, vocabulary, imputation values) on the *whole* dataset before splitting.

```python
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(0)
X = rng.normal(50, 10, size=(100, 1))
X_train, X_test = train_test_split(X, test_size=0.25, random_state=0)

scaler = StandardScaler().fit(X_train)       # learn mean/std from TRAIN only
X_train_s = scaler.transform(X_train)
X_test_s = scaler.transform(X_test)          # reuse the same numbers on TEST
print(f"train mean {X_train_s.mean():.3f}, std {X_train_s.std():.3f}")
print(f"test  mean {X_test_s.mean():.3f}, std {X_test_s.std():.3f}")
```

```output
train mean 0.000, std 1.000
test  mean -0.083, std 0.792
```

The test set's mean is not exactly 0 — and that's correct. It is "new" data, scaled with the training statistics.

**Pipelines** make this automatic and also apply it correctly inside cross-validation:

```python
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LogisticRegression

numeric = make_pipeline(SimpleImputer(strategy="median"), StandardScaler())
categorical = OneHotEncoder(handle_unknown="ignore")
prep = ColumnTransformer([("num", numeric, ["age", "income"]),
                          ("cat", categorical, ["city"])])
model = make_pipeline(prep, LogisticRegression())
# model.fit(df_train, y_train); model.predict(df_test)
```

## 5. Other common steps

- **Outliers** — detect with IQR rules or z-scores; cap (winsorize), transform, or remove only with a reason.
- **Skewed features** — a log transform ($\log(1 + x)$) tames long right tails such as income or counts.
- **Feature engineering** — dates → day of week / month; text → TF-IDF; ratios and interactions.
- **Class imbalance** — stratified splits, class weights, resampling (SMOTE), and metrics beyond accuracy.
- **Train / validation / test split** — and keep the test set untouched until the end.

> [!WARNING]
> - Fitting a scaler, imputer or encoder on all the data before splitting (leakage).
> - Using `fit_transform` on the test set — it should only be `transform`.
> - One-hot encoding before splitting so unseen categories "exist" in training.
> - Ordinal-encoding unordered categories (`Delhi=0, Pune=1, Chennai=2` implies Chennai > Pune).
> - Scaling the **target** of a regression and forgetting to invert predictions.

## Interview questions

> [!INTERVIEW] Normalization vs standardization?
> Normalization (min-max) rescales to a fixed range such as $[0, 1]$; standardization rescales to mean 0 and standard deviation 1. Standardization is less distorted by outliers and is the usual default for linear models, SVMs and PCA.

> [!INTERVIEW] Do decision trees need feature scaling?
> No. A split like $x_j \le t$ only depends on the ordering of values, which monotonic scaling preserves.

> [!INTERVIEW] What is data leakage? Give an example.
> Training on information that would not be available at prediction time. Examples: scaling with the full-data mean, a feature computed *after* the outcome (e.g. "account closed" when predicting churn), or duplicates of the same patient in both train and test.

> [!REMEMBER]
> Impute → encode → scale, all **fit on train only** (use a `Pipeline`). Distance/gradient models need scaling; trees don't.
