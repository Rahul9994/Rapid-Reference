import { lazy, Suspense, useEffect, useState, type ReactNode } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import { AnimatePresence } from 'motion/react'
import { Navbar } from './components/layout/Navbar'
import { Footer } from './components/layout/Footer'
import { ScrollToTop } from './components/layout/ScrollToTop'
import { BootScreen } from './components/layout/BootScreen'
import { PageShell, PageSkeleton } from './components/layout/PageShell'
import { Toaster } from './components/ui/Toaster'
import { paletteOpen } from './lib/atom'
import { useHotkey } from './hooks'
import Home from './pages/Home'

const NotesHome = lazy(() => import('./pages/NotesHome'))
const NotesDocs = lazy(() => import('./pages/NotesDocs'))
const LabHome = lazy(() => import('./pages/LabHome'))
const LabTopic = lazy(() => import('./pages/LabTopic'))
const DsaSheet = lazy(() => import('./pages/DsaSheet'))
const Faq = lazy(() => import('./pages/Faq'))
const About = lazy(() => import('./pages/About'))
const NotFound = lazy(() => import('./pages/NotFound'))
const CommandPalette = lazy(() => import('./components/search/CommandPalette'))

function Lazy({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>
}

export default function App({ boot }: { boot: boolean }) {
  const location = useLocation()
  const segment = location.pathname.split('/')[1] || 'home'
  const [booting, setBooting] = useState(boot)
  const paletteIsOpen = paletteOpen.use()
  const [paletteLoaded, setPaletteLoaded] = useState(false)

  useEffect(() => {
    if (paletteIsOpen) setPaletteLoaded(true)
  }, [paletteIsOpen])

  useHotkey('mod+k', (e) => {
    e.preventDefault()
    paletteOpen.set((o) => !o)
  })
  useHotkey('/', (e) => {
    e.preventDefault()
    paletteOpen.set(true)
  })

  return (
    <div className="noise relative flex min-h-[100dvh] flex-col">
      <a
        href="#main"
        className="sr-only z-[300] rounded-full bg-accent px-4 py-2 text-sm font-medium text-on-accent focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      {booting && (
        <BootScreen
          onFinished={() => {
            try {
              sessionStorage.setItem('rr:booted', '1')
            } catch {
              /* ignore */
            }
            setBooting(false)
          }}
        />
      )}
      <Navbar />
      <AnimatePresence mode="wait" onExitComplete={() => window.scrollTo(0, 0)}>
        <Routes location={location} key={segment}>
          <Route path="/" element={<Home />} />
          <Route path="/notes" element={<Lazy><NotesHome /></Lazy>} />
          <Route path="/notes/:category" element={<Lazy><NotesDocs /></Lazy>} />
          <Route path="/notes/:category/:topic" element={<Lazy><NotesDocs /></Lazy>} />
          <Route path="/ai" element={<Lazy><LabHome trackId="ai" /></Lazy>} />
          <Route path="/ai/:topic" element={<Lazy><LabTopic trackId="ai" /></Lazy>} />
          <Route path="/ml" element={<Lazy><LabHome trackId="ml" /></Lazy>} />
          <Route path="/ml/:topic" element={<Lazy><LabTopic trackId="ml" /></Lazy>} />
          <Route path="/dsa-sheet" element={<Lazy><DsaSheet /></Lazy>} />
          <Route path="/faq" element={<Lazy><Faq /></Lazy>} />
          <Route path="/about" element={<Lazy><About /></Lazy>} />
          <Route path="*" element={<Lazy><PageShell><NotFound /></PageShell></Lazy>} />
        </Routes>
      </AnimatePresence>
      <Footer />
      <ScrollToTop />
      <Toaster />
      {paletteLoaded && (
        <Suspense fallback={null}>
          <CommandPalette />
        </Suspense>
      )}
    </div>
  )
}
