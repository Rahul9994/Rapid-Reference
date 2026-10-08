import GridSearch from './GridSearch'

export default function UninformedSearch() {
  return <GridSearch algos={['bfs', 'dfs', 'ucs']} initial="bfs" />
}
