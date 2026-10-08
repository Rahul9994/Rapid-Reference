import { allTopics, topicByKey } from './notes'
import { allLabTopics, labTopicByKey, labTopicPath } from './labs'

/** A notes topic or an A.I / M.L lesson, in one shape (recents, bookmarks, search, random). */
export interface AnyTopic {
  key: string
  slug: string
  title: string
  summary: string
  path: string
  /** category / track id — also the CategoryIcon id */
  group: string
  groupTitle: string
  groupShort: string
  hue: string
  lab: boolean
}

export function lookupTopic(key: string): AnyTopic | undefined {
  const n = topicByKey.get(key)
  if (n) {
    return {
      key,
      slug: n.slug,
      title: n.title,
      summary: n.summary,
      path: `/notes/${n.category.id}/${n.slug}`,
      group: n.category.id,
      groupTitle: n.category.title,
      groupShort: n.category.short,
      hue: n.category.hue,
      lab: false,
    }
  }
  const l = labTopicByKey.get(key)
  if (l) {
    return {
      key,
      slug: l.slug,
      title: l.title,
      summary: l.summary,
      path: labTopicPath(l),
      group: l.track.id,
      groupTitle: l.track.title,
      groupShort: l.track.label,
      hue: l.track.hue,
      lab: true,
    }
  }
  return undefined
}

export const everyTopicKey: string[] = [...allTopics.map((t) => t.key), ...allLabTopics.map((t) => t.key)]
export const totalAllTopics = everyTopicKey.length
