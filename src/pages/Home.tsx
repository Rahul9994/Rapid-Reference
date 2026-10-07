import { useEffect } from 'react'
import { PageShell } from '../components/layout/PageShell'
import { Hero } from '../components/home/Hero'
import { Inside } from '../components/home/Inside'
import { Categories } from '../components/home/Categories'
import { SheetHighlight } from '../components/home/SheetHighlight'
import { FaqHighlight } from '../components/home/FaqHighlight'
import { QuickAccess } from '../components/home/QuickAccess'

export default function Home() {
  useEffect(() => {
    document.title = 'Rapid_Reference — Learn faster. Revise smarter.'
  }, [])

  return (
    <PageShell>
      <Hero />
      <Inside />
      <Categories />
      <SheetHighlight />
      <FaqHighlight />
      <QuickAccess />
    </PageShell>
  )
}
