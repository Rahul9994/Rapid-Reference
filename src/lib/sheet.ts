export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export interface SheetItem {
  id: number
  n: number
  title: string
  kind: 'practice' | 'lesson'
  difficulty: Difficulty | null
  url: string
  video?: string
  article?: string
  leetcode?: string
  tags?: string[]
}

export interface SheetGroup {
  id: string
  title: string
  items: SheetItem[]
}

export interface SheetSection {
  id: string
  title: string
  groups: SheetGroup[]
}

export interface SheetData {
  meta: {
    name: string
    author: string
    source: string
    fetchedAt: string
    total: number
    practice: number
    lessons: number
  }
  sections: SheetSection[]
}

export interface FlatSheetItem extends SheetItem {
  sectionId: string
  sectionTitle: string
  sectionIndex: number
  groupTitle: string
}

let sheetPromise: Promise<SheetData> | null = null

export function loadSheet(): Promise<SheetData> {
  if (!sheetPromise) {
    sheetPromise = import('../data/a2z-sheet.json').then((m) => m.default as unknown as SheetData)
    sheetPromise.catch(() => {
      sheetPromise = null
    })
  }
  return sheetPromise
}

export function flattenSheet(data: SheetData): FlatSheetItem[] {
  return data.sections.flatMap((s, sectionIndex) =>
    s.groups.flatMap((g) =>
      g.items.map((it) => ({ ...it, sectionId: s.id, sectionTitle: s.title, sectionIndex, groupTitle: g.title })),
    ),
  )
}

export const difficultyRank: Record<string, number> = { Easy: 1, Medium: 2, Hard: 3 }
