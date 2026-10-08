export const themes = [
  { id: 'noir', name: 'Noir', blurb: 'Black & champagne gold', mode: 'dark' },
  { id: 'ivory', name: 'Ivory', blurb: 'Warm paper & ink', mode: 'light' },
  { id: 'dark', name: 'Dark', blurb: 'Zinc & violet glow', mode: 'dark' },
  { id: 'light', name: 'Light', blurb: 'Crisp & airy', mode: 'light' },
  { id: 'midnight', name: 'Midnight', blurb: 'Deep navy blues', mode: 'dark' },
  { id: 'cyberpunk', name: 'Cyberpunk', blurb: 'Neon on void', mode: 'dark' },
  { id: 'aurora', name: 'Aurora', blurb: 'Mint & violet lights', mode: 'dark' },
  { id: 'amoled', name: 'AMOLED', blurb: 'True black, pure contrast', mode: 'dark' },
  { id: 'dracula', name: 'Dracula', blurb: 'The classic palette', mode: 'dark' },
  { id: 'ocean', name: 'Ocean', blurb: 'Cyan depths', mode: 'dark' },
  { id: 'forest', name: 'Forest', blurb: 'Emerald canopy', mode: 'dark' },
  { id: 'sunset', name: 'Sunset', blurb: 'Coral & ember', mode: 'dark' },
  { id: 'nord', name: 'Nord', blurb: 'Arctic frost', mode: 'dark' },
  { id: 'sepia', name: 'Sepia', blurb: 'Warm paper for long reads', mode: 'light' },
] as const

export type ThemeId = (typeof themes)[number]['id']
export type ThemeChoice = ThemeId | 'system'

export const themeIds = themes.map((t) => t.id) as ThemeId[]

export function isThemeChoice(v: unknown): v is ThemeChoice {
  return v === 'system' || themeIds.includes(v as ThemeId)
}
