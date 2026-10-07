import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import { MotionConfig } from 'motion/react'
import '@fontsource-variable/geist'
import '@fontsource-variable/geist-mono'
import '@fontsource/instrument-serif/400.css'
import '@fontsource/instrument-serif/400-italic.css'
import './styles/index.css'
import App from './App'
import { initTheme } from './lib/theme'
import { bootDone } from './lib/atom'
import { BASE_PATH, prefersReducedMotion } from './lib/utils'

initTheme()

function shouldBoot(): boolean {
  const path = window.location.pathname.replace(/\/$/, '')
  if (path !== BASE_PATH || prefersReducedMotion()) return false
  try {
    return !sessionStorage.getItem('rr:booted')
  } catch {
    return false
  }
}

const boot = shouldBoot()
if (boot) bootDone.set(false)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={BASE_PATH || '/'}>
      <MotionConfig reducedMotion="user">
        <App boot={boot} />
      </MotionConfig>
    </BrowserRouter>
  </StrictMode>,
)
