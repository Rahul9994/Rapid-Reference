## What is the difference between supervised, unsupervised and reinforcement learning?

**Supervised** learning trains on labelled examples (x, y) to predict labels — regression for numbers, classification for categories. **Unsupervised** learning finds structure in unlabelled data — clustering, dimensionality reduction, anomaly detection. **Reinforcement** learning trains an agent by trial and error from rewards in an environment. See the [M.L track](/ml/introduction).

## What is overfitting and how do you prevent it?

Overfitting is when a model learns noise in the training data, so it scores well on training data and poorly on new data (high variance). Prevent it with more data or augmentation, simpler models, regularization (L1/L2, dropout), early stopping, cross-validation to choose complexity, and ensembles such as bagging.

## Explain the bias–variance trade-off.

Expected error = bias² + variance + irreducible noise. **Bias** is systematic error from a model that's too simple (underfitting); **variance** is sensitivity to the particular training sample from a model that's too complex (overfitting). Increasing complexity lowers bias and raises variance; you pick the complexity that minimises validation error.

## Why do we split data into train, validation and test sets?

Training data fits the parameters, validation data is used repeatedly to choose hyperparameters and models, and the test set is used **once** at the end for an unbiased estimate. Tuning on the test set makes its score optimistic.

## What is cross-validation?

k-fold cross-validation splits data into k folds, trains on k − 1 and validates on the remaining one, rotating so every fold is used for validation once, then reports the mean ± standard deviation. It gives a more reliable estimate than a single split. Use stratified folds for classification and time-ordered splits for time series.

## What is gradient descent? What does the learning rate do?

An iterative optimizer that updates parameters in the opposite direction of the loss gradient: w ← w − α·∇J(w). The learning rate α sets the step size — too small converges slowly, too large oscillates or diverges. Variants: batch, stochastic and mini-batch; momentum and Adam speed things up.

## L1 vs L2 regularization?

Both add a penalty on weight size to the loss. **L2 (ridge)** adds Σw² and shrinks all weights smoothly. **L1 (lasso)** adds Σ|w| and drives some weights exactly to zero, performing feature selection — its diamond-shaped constraint region has corners on the axes.

## Why is logistic regression used for classification if it's called regression?

It models the **log-odds** of the positive class as a linear function of the features, then applies the sigmoid to get a probability between 0 and 1. Thresholding that probability (0.5 by default) gives a class. It's trained with log-loss (cross-entropy), not mean squared error.

## Precision vs recall — when do you prefer each?

**Precision** = TP / (TP + FP): of predicted positives, how many are right. **Recall** = TP / (TP + FN): of actual positives, how many were found. Prefer recall when missing a positive is costly (disease screening, fraud); prefer precision when false alarms are costly (spam filtering). F1 is their harmonic mean.

## Why is accuracy a bad metric for imbalanced data?

If 99% of samples are negative, always predicting "negative" scores 99% accuracy while being useless. Use precision, recall, F1, PR-AUC, ROC-AUC and the confusion matrix, and consider class weights or resampling.

## What is ROC-AUC?

The ROC curve plots true-positive rate against false-positive rate across all thresholds; AUC is the area under it. It equals the probability that a random positive is scored higher than a random negative — 0.5 is random, 1.0 is perfect ranking.

## How does a decision tree decide where to split?

It tries every feature and threshold and picks the split that most reduces impurity — Gini impurity (1 − Σp²) or entropy (−Σp log p) for classification, variance for regression — greedily at each node. Trees need no feature scaling and overfit easily, so limit depth or prune.

## Bagging vs boosting?

**Bagging** trains models independently on bootstrap samples and averages them, mainly reducing variance — random forests add random feature subsets. **Boosting** trains models sequentially, each correcting the previous ones' errors (AdaBoost re-weights samples, gradient boosting fits residuals), mainly reducing bias.

## How does k-means work and how do you choose k?

Initialise k centroids (k-means++), assign each point to its nearest centroid, move each centroid to the mean of its points, and repeat until assignments stop changing. It minimises within-cluster squared distance but finds local optima and assumes round clusters. Choose k with the elbow method, silhouette score or domain needs.

## What is PCA?

Principal component analysis finds orthogonal directions of maximum variance — the eigenvectors of the covariance matrix of centred data — and projects data onto the top few to reduce dimensionality with minimal information loss. Standardize features first; it's unsupervised and linear.

## Why do neural networks need non-linear activation functions?

Without them, a stack of layers collapses into one linear transformation and can only learn linear boundaries. Non-linear activations such as ReLU let networks approximate complex functions. ReLU is preferred in hidden layers because it doesn't saturate for positive inputs, which reduces vanishing gradients.

## What is backpropagation?

The algorithm that computes the gradient of the loss with respect to every weight by applying the chain rule backwards through the network, reusing intermediate results so it costs about as much as a forward pass. An optimizer (SGD, Adam) then uses those gradients to update the weights.

## What is data leakage?

When information that wouldn't be available at prediction time influences training — for example fitting a scaler or imputer on the full dataset before splitting, features derived from the target, or the same entity appearing in both train and test. It inflates validation scores and fails in production. Use pipelines and split first.
