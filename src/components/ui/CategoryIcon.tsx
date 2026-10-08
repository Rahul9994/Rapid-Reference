import { BrainCircuit, ChartScatter, Cpu, Database, Globe, MessageSquareQuote, Waypoints } from 'lucide-react'
import { PythonIcon } from './Icons'

export type CategoryIconKey = 'python' | 'dsa' | 'os' | 'dbms' | 'cn' | 'ai' | 'ml' | 'interview'

export function CategoryIcon({ id, size = 18, className }: { id: string; size?: number; className?: string }) {
  switch (id) {
    case 'python':
      return <PythonIcon size={size} className={className} />
    case 'dsa':
      return <Waypoints size={size} className={className} aria-hidden="true" />
    case 'os':
      return <Cpu size={size} className={className} aria-hidden="true" />
    case 'dbms':
      return <Database size={size} className={className} aria-hidden="true" />
    case 'cn':
      return <Globe size={size} className={className} aria-hidden="true" />
    case 'ai':
      return <BrainCircuit size={size} className={className} aria-hidden="true" />
    case 'ml':
      return <ChartScatter size={size} className={className} aria-hidden="true" />
    default:
      return <MessageSquareQuote size={size} className={className} aria-hidden="true" />
  }
}
