/**
 * A.I and M.L tracks. Each topic is a Markdown note at
 * src/content/<track>/<slug>.md plus an interactive visualization (`viz`,
 * registered in src/viz/registry.ts) shown above the notes.
 */

export type TrackId = 'ai' | 'ml'

export interface LabTopic {
  slug: string
  title: string
  summary: string
  module: string
  /** Visualization id from src/viz/registry.ts */
  viz: string
}

export interface LabTrack {
  id: TrackId
  /** Route + nav label */
  path: '/ai' | '/ml'
  label: string
  title: string
  short: string
  tagline: string
  description: string
  hue: string
  modules: { id: string; title: string; blurb: string }[]
  topics: LabTopic[]
}

export const labTracks: LabTrack[] = [
  {
    id: 'ai',
    path: '/ai',
    label: 'A.I',
    title: 'Artificial Intelligence',
    short: 'AI',
    tagline: 'Machines that search, reason and decide.',
    description:
      'Agents, search, game playing, logic, probability, reinforcement learning and modern language models — each concept paired with a live, animated visualization.',
    hue: '#d9a3ec',
    modules: [
      { id: 'foundations', title: 'Foundations', blurb: 'What AI is, and the agents that act in the world.' },
      { id: 'search', title: 'Search & Problem Solving', blurb: 'Finding paths, winning games and satisfying constraints.' },
      { id: 'reasoning', title: 'Knowledge & Reasoning', blurb: 'Logic and probability: drawing conclusions from what you know.' },
      { id: 'decisions', title: 'Decision Making', blurb: 'Acting well under uncertainty, and learning from reward.' },
      { id: 'language', title: 'Language & Generative AI', blurb: 'From words as vectors to transformers and LLMs.' },
      { id: 'responsible', title: 'Responsible AI', blurb: 'Fairness, transparency and safety.' },
    ],
    topics: [
      { slug: 'introduction', module: 'foundations', viz: 'ai-landscape', title: 'What is Artificial Intelligence?', summary: 'AI vs ML vs DL vs GenAI, narrow vs general AI, the Turing test and a short history.' },
      { slug: 'intelligent-agents', module: 'foundations', viz: 'vacuum-agent', title: 'Intelligent Agents', summary: 'Percepts, actions, PEAS, environment types and the five agent architectures.' },
      { slug: 'uninformed-search', module: 'search', viz: 'grid-search-uninformed', title: 'Uninformed Search', summary: 'BFS, DFS, uniform-cost and iterative deepening — frontier, explored set, guarantees.' },
      { slug: 'informed-search', module: 'search', viz: 'grid-search-informed', title: 'Informed Search & A*', summary: 'Heuristics, greedy best-first, A*, admissibility and consistency.' },
      { slug: 'adversarial-search', module: 'search', viz: 'minimax', title: 'Adversarial Search', summary: 'Game trees, minimax and alpha–beta pruning.' },
      { slug: 'local-search', module: 'search', viz: 'hill-climbing', title: 'Local Search', summary: 'Hill climbing, local maxima, random restarts and simulated annealing.' },
      { slug: 'genetic-algorithms', module: 'search', viz: 'genetic', title: 'Genetic Algorithms', summary: 'Populations, fitness, selection, crossover and mutation.' },
      { slug: 'csp', module: 'search', viz: 'map-coloring', title: 'Constraint Satisfaction', summary: 'Variables, domains, constraints, backtracking, forward checking, MRV.' },
      { slug: 'knowledge-logic', module: 'reasoning', viz: 'forward-chaining', title: 'Knowledge & Logic', summary: 'Propositional and first-order logic, inference rules, forward and backward chaining.' },
      { slug: 'probabilistic-reasoning', module: 'reasoning', viz: 'bayes-theorem', title: 'Probabilistic Reasoning', summary: "Conditional probability, Bayes' theorem and Bayesian networks." },
      { slug: 'mdp', module: 'decisions', viz: 'value-iteration', title: 'Markov Decision Processes', summary: 'States, actions, rewards, discounting, the Bellman equation and value iteration.' },
      { slug: 'reinforcement-learning', module: 'decisions', viz: 'q-learning', title: 'Reinforcement Learning', summary: 'Learning from reward: exploration vs exploitation and Q-learning.' },
      { slug: 'nlp-basics', module: 'language', viz: 'word-embeddings', title: 'NLP Fundamentals', summary: 'Tokenization, normalization, bag-of-words, TF-IDF and word embeddings.' },
      { slug: 'transformers-attention', module: 'language', viz: 'attention', title: 'Transformers & Attention', summary: 'Queries, keys and values, scaled dot-product attention, multi-head attention.' },
      { slug: 'llms-generative-ai', module: 'language', viz: 'next-token', title: 'LLMs & Generative AI', summary: 'Next-token prediction, temperature, top-k / top-p, RLHF, RAG and hallucinations.' },
      { slug: 'ai-ethics', module: 'responsible', viz: 'fairness', title: 'AI Ethics & Fairness', summary: 'Bias, fairness metrics, explainability, privacy and safety.' },
    ],
  },
  {
    id: 'ml',
    path: '/ml',
    label: 'M.L',
    title: 'Machine Learning',
    short: 'ML',
    tagline: 'Watch the math move.',
    description:
      'Every algorithm is a live lab: real Python on one side, a moving graph on the other, with the running line highlighted as the model learns.',
    hue: '#f0aa6a',
    modules: [
      { id: 'foundations', title: 'Foundations', blurb: 'The workflow, and getting data into shape.' },
      { id: 'regression', title: 'Regression & Optimization', blurb: 'Fitting lines, descending loss surfaces, controlling complexity.' },
      { id: 'classification', title: 'Classification', blurb: 'Drawing boundaries between classes.' },
      { id: 'unsupervised', title: 'Unsupervised Learning', blurb: 'Finding structure without labels.' },
      { id: 'deep-learning', title: 'Deep Learning', blurb: 'Neurons, layers, backprop and convolutions.' },
      { id: 'evaluation', title: 'Model Evaluation', blurb: 'Measuring what actually matters.' },
    ],
    topics: [
      { slug: 'introduction', module: 'foundations', viz: 'ml-pipeline', title: 'What is Machine Learning?', summary: 'Supervised, unsupervised and reinforcement learning, and the end-to-end ML workflow.' },
      { slug: 'data-preprocessing', module: 'foundations', viz: 'feature-scaling', title: 'Data Preprocessing', summary: 'Missing values, encoding, normalization vs standardization, and data leakage.' },
      { slug: 'linear-regression', module: 'regression', viz: 'linear-regression', title: 'Linear Regression', summary: 'Fitting y = wx + b with gradient descent, MSE, the normal equation and R².' },
      { slug: 'gradient-descent', module: 'regression', viz: 'gradient-descent', title: 'Gradient Descent', summary: 'Loss landscapes, learning rate, batch vs stochastic vs mini-batch, momentum.' },
      { slug: 'bias-variance', module: 'regression', viz: 'polynomial-fit', title: 'Bias–Variance & Overfitting', summary: 'Underfitting vs overfitting, model complexity and the bias–variance trade-off.' },
      { slug: 'regularization', module: 'regression', viz: 'regularization', title: 'Regularization', summary: 'Ridge (L2), Lasso (L1) and Elastic Net — and why L1 gives sparse weights.' },
      { slug: 'logistic-regression', module: 'classification', viz: 'logistic-regression', title: 'Logistic Regression', summary: 'Sigmoid, log-loss, decision boundaries and multiclass with softmax.' },
      { slug: 'knn', module: 'classification', viz: 'knn', title: 'K-Nearest Neighbors', summary: 'Distance metrics, choosing k, scaling and the curse of dimensionality.' },
      { slug: 'naive-bayes', module: 'classification', viz: 'naive-bayes', title: 'Naive Bayes', summary: "Bayes' theorem, the independence assumption, Gaussian and multinomial NB." },
      { slug: 'decision-trees', module: 'classification', viz: 'decision-tree', title: 'Decision Trees', summary: 'Entropy, Gini impurity, information gain, splitting and pruning.' },
      { slug: 'ensemble-methods', module: 'classification', viz: 'adaboost', title: 'Ensemble Methods', summary: 'Bagging, random forests, AdaBoost and gradient boosting.' },
      { slug: 'svm', module: 'classification', viz: 'svm', title: 'Support Vector Machines', summary: 'Maximum margin, support vectors, soft margins (C) and the kernel trick.' },
      { slug: 'k-means', module: 'unsupervised', viz: 'kmeans', title: 'K-Means Clustering', summary: "Lloyd's algorithm, inertia, the elbow method and k-means++." },
      { slug: 'dbscan-hierarchical', module: 'unsupervised', viz: 'dbscan', title: 'DBSCAN & Hierarchical Clustering', summary: 'Density-based clusters, core / border / noise points, and dendrograms.' },
      { slug: 'pca', module: 'unsupervised', viz: 'pca', title: 'Principal Component Analysis', summary: 'Variance, covariance, eigenvectors and projecting to fewer dimensions.' },
      { slug: 'perceptron', module: 'deep-learning', viz: 'perceptron', title: 'Perceptron & Activations', summary: 'The artificial neuron, the perceptron learning rule and activation functions.' },
      { slug: 'neural-networks', module: 'deep-learning', viz: 'neural-network', title: 'Neural Networks', summary: 'Multi-layer perceptrons, forward propagation and learning non-linear boundaries.' },
      { slug: 'backpropagation', module: 'deep-learning', viz: 'backprop', title: 'Backpropagation', summary: 'Computational graphs and the chain rule, one local gradient at a time.' },
      { slug: 'cnn', module: 'deep-learning', viz: 'convolution', title: 'Convolutional Neural Networks', summary: 'Kernels, feature maps, stride, padding and pooling.' },
      { slug: 'evaluation-metrics', module: 'evaluation', viz: 'roc-threshold', title: 'Evaluation Metrics', summary: 'Confusion matrix, precision, recall, F1, ROC-AUC and regression metrics.' },
      { slug: 'cross-validation', module: 'evaluation', viz: 'k-fold', title: 'Cross-Validation & Tuning', summary: 'Train / validation / test splits, k-fold CV and hyperparameter search.' },
    ],
  },
]

export const trackById = Object.fromEntries(labTracks.map((t) => [t.id, t])) as Record<TrackId, LabTrack>

export interface FlatLabTopic extends LabTopic {
  key: string
  track: LabTrack
  index: number
}

export const allLabTopics: FlatLabTopic[] = labTracks.flatMap((track) =>
  track.topics.map((t, index) => ({ ...t, key: `${track.id}/${t.slug}`, track, index })),
)

export const labTopicByKey = new Map(allLabTopics.map((t) => [t.key, t]))

export function getLabTopic(track: TrackId, slug: string): FlatLabTopic | undefined {
  return labTopicByKey.get(`${track}/${slug}`)
}

export function getAdjacentLabTopics(key: string): { prev?: FlatLabTopic; next?: FlatLabTopic } {
  const t = labTopicByKey.get(key)
  if (!t) return {}
  const list = allLabTopics.filter((x) => x.track.id === t.track.id)
  const i = list.findIndex((x) => x.key === key)
  return { prev: list[i - 1], next: list[i + 1] }
}

export function labTopicPath(t: FlatLabTopic): string {
  return `${t.track.path}/${t.slug}`
}

export function moduleTitle(track: LabTrack, moduleId: string): string {
  return track.modules.find((m) => m.id === moduleId)?.title ?? moduleId
}

export const totalLabTopics = allLabTopics.length
