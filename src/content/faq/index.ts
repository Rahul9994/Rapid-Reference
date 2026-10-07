// All FAQ categories ship as one lazily-loaded chunk.
const files = import.meta.glob<string>('./*.md', { query: '?raw', import: 'default', eager: true })

export default files
