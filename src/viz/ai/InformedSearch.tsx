import GridSearch from './GridSearch'

export default function InformedSearch() {
  return <GridSearch algos={['astar', 'greedy', 'ucs']} initial="astar" />
}
