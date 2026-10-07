import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { allTopics } from '../data/notes'
import { flattenSheet, loadSheet } from './sheet'
import { sheetProgressStore } from './storage'
import { toast } from './toast'
import { pickRandom } from './utils'

export function useRandomActions() {
  const navigate = useNavigate()

  const randomTopic = useCallback(() => {
    const t = pickRandom(allTopics)
    if (!t) return
    navigate(`/notes/${t.category.id}/${t.slug}`)
    toast(`Random topic: ${t.title}`, { description: t.category.title, tone: 'info' })
  }, [navigate])

  const randomProblem = useCallback(async () => {
    try {
      const data = await loadSheet()
      const done = sheetProgressStore.get()
      const pool = flattenSheet(data).filter((p) => p.kind === 'practice' && !done[p.id])
      const p = pickRandom(pool)
      if (!p) {
        toast('Every problem is completed!', { description: 'Legendary. Time to revise.', tone: 'success' })
        return
      }
      navigate(`/dsa-sheet?focus=${p.id}`)
    } catch {
      toast('Could not load the DSA sheet', { tone: 'error' })
    }
  }, [navigate])

  return { randomTopic, randomProblem }
}
