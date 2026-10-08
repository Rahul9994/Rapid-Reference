import { useCallback } from 'react'
import { useNavigate } from 'react-router'
import { everyTopicKey, lookupTopic } from '../data/catalog'
import { flattenSheet, loadSheet } from './sheet'
import { sheetProgressStore } from './storage'
import { toast } from './toast'
import { pickRandom } from './utils'

export function useRandomActions() {
  const navigate = useNavigate()

  const randomTopic = useCallback(() => {
    const key = pickRandom(everyTopicKey)
    const t = key ? lookupTopic(key) : undefined
    if (!t) return
    navigate(t.path)
    toast(`Random topic: ${t.title}`, { description: t.groupTitle, tone: 'info' })
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
