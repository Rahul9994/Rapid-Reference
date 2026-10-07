/**
 * FAQ categories. Questions live in src/content/faq/<id>.md as
 * "## Question" headings followed by the answer in Markdown.
 */
export const faqCategories = [
  { id: 'python', title: 'Python', hue: '#5b9dff' },
  { id: 'dsa', title: 'DSA', hue: '#a78bfa' },
  { id: 'oop', title: 'OOP', hue: '#f472b6' },
  { id: 'os', title: 'Operating Systems', hue: '#34d399' },
  { id: 'dbms', title: 'DBMS', hue: '#fbbf24' },
  { id: 'cn', title: 'Computer Networks', hue: '#22d3ee' },
  { id: 'general', title: 'General Technical', hue: '#fb923c' },
  { id: 'hr', title: 'HR & Behavioral', hue: '#94a3b8' },
] as const

export type FaqCategoryId = (typeof faqCategories)[number]['id']

export interface FaqItem {
  id: string
  category: FaqCategoryId
  question: string
  answer: string
  index: number
}
