import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

type Viz = LazyExoticComponent<ComponentType>

/**
 * Every interactive visualization, code-split so a topic page only downloads
 * the labs it shows. Ids are referenced from src/data/labs.ts and from
 * ```viz <id>``` fences inside the Markdown notes.
 */
export const vizRegistry: Record<string, Viz> = {
  // M.L
  'linear-regression': lazy(() => import('./ml/LinearRegression')),
  'gradient-descent': lazy(() => import('./ml/GradientDescent')),
  'polynomial-fit': lazy(() => import('./ml/PolynomialFit')),
  regularization: lazy(() => import('./ml/Regularization')),
  'logistic-regression': lazy(() => import('./ml/LogisticRegression')),
  knn: lazy(() => import('./ml/Knn')),
  'naive-bayes': lazy(() => import('./ml/NaiveBayes')),
  'decision-tree': lazy(() => import('./ml/DecisionTree')),
  adaboost: lazy(() => import('./ml/AdaBoost')),
  svm: lazy(() => import('./ml/Svm')),
  'svm-kernel': lazy(() => import('./ml/SvmKernel')),
  kmeans: lazy(() => import('./ml/KMeans')),
  dbscan: lazy(() => import('./ml/Dbscan')),
  pca: lazy(() => import('./ml/Pca')),
  perceptron: lazy(() => import('./ml/Perceptron')),
  activations: lazy(() => import('./ml/Activations')),
  'neural-network': lazy(() => import('./ml/NeuralNetwork')),
  backprop: lazy(() => import('./ml/Backprop')),
  convolution: lazy(() => import('./ml/Convolution')),
  'roc-threshold': lazy(() => import('./ml/RocThreshold')),
  'k-fold': lazy(() => import('./ml/KFold')),
  'ml-pipeline': lazy(() => import('./ml/MlPipeline')),
  'feature-scaling': lazy(() => import('./ml/FeatureScaling')),

  // A.I
  'ai-landscape': lazy(() => import('./ai/AiLandscape')),
  'vacuum-agent': lazy(() => import('./ai/VacuumAgent')),
  'grid-search-uninformed': lazy(() => import('./ai/UninformedSearch')),
  'grid-search-informed': lazy(() => import('./ai/InformedSearch')),
  minimax: lazy(() => import('./ai/Minimax')),
  'hill-climbing': lazy(() => import('./ai/HillClimbing')),
  genetic: lazy(() => import('./ai/Genetic')),
  'map-coloring': lazy(() => import('./ai/MapColoring')),
  'forward-chaining': lazy(() => import('./ai/ForwardChaining')),
  'bayes-theorem': lazy(() => import('./ai/BayesTheorem')),
  'value-iteration': lazy(() => import('./ai/ValueIteration')),
  'q-learning': lazy(() => import('./ai/QLearning')),
  'word-embeddings': lazy(() => import('./ai/WordEmbeddings')),
  attention: lazy(() => import('./ai/Attention')),
  'next-token': lazy(() => import('./ai/NextToken')),
  fairness: lazy(() => import('./ai/Fairness')),
}

export function hasViz(id: string): boolean {
  return id in vizRegistry
}
