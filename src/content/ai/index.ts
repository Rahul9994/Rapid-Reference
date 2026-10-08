// Bundles every topic in this category into one lazily-loaded chunk.
const files = import.meta.glob<string>('./*.md', { query: '?raw', import: 'default', eager: true })

export default files
