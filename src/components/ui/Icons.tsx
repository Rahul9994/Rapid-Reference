import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

export function GithubIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  )
}

export function YoutubeIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="m10 9 5 3-5 3z" fill="currentColor" />
    </svg>
  )
}

export function LeetCodeIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d="M14.5 3.5 6.8 11.2a1.8 1.8 0 0 0 0 2.6l4.4 4.5a1.8 1.8 0 0 0 2.6 0l2.2-2.2" />
      <path d="M10.5 13H19" />
      <path d="m15.8 7.6 1.7 1.7" />
    </svg>
  )
}

export function PythonIcon({ size = 18, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" {...props}>
      <path d="M11.9 2C7.4 2 7.7 4 7.7 4v2.1H12v.6H5.9S3 6.4 3 11s2.5 4.4 2.5 4.4H7v-2.1s-.1-2.5 2.5-2.5h4.2s2.4 0 2.4-2.3V4.6S16.5 2 11.9 2Zm-2.3 1.3a.8.8 0 1 1 0 1.6.8.8 0 0 1 0-1.6Z" />
      <path d="M12.1 22c4.5 0 4.2-2 4.2-2v-2.1H12v-.6h6.1S21 17.6 21 13s-2.5-4.4-2.5-4.4H17v2.1s.1 2.5-2.5 2.5h-4.2s-2.4 0-2.4 2.3v3.9S7.5 22 12.1 22Zm2.3-1.3a.8.8 0 1 1 0-1.6.8.8 0 0 1 0 1.6Z" opacity=".75" />
    </svg>
  )
}
