import { useEffect } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'framer-motion'
import { Experience } from './scene/Experience'
import { useChronos } from './store/useChronos'
import { startDirector } from './director'
import { EraPanel } from './ui/EraPanel'
import { EventsPanel } from './ui/EventsPanel'
import { AlternatePanel } from './ui/AlternatePanel'
import { EventTooltip } from './ui/EventTooltip'
import { TitleScreen } from './ui/TitleScreen'
import { Hud } from './ui/Hud'
import { CountrySearch } from './ui/CountrySearch'
import { CountryTooltip } from './ui/CountryTooltip'
import { ZonePanel } from './ui/ZonePanel'
import { Loader } from './ui/Loader'
import { SoundToggle } from './ui/SoundToggle'
import { ComparisonView } from './ui/ComparisonView'
import { fetchShare } from './api/client'
import { sharedIdFromUrl } from './lib/share'

/** A warm flash across the screen while the chosen event shatters. */
function FractureVeil() {
  const fracturing = useChronos((s) => s.fracturing)
  return (
    <AnimatePresence>
      {fracturing && (
        <motion.div
          key="veil"
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_40%_40%,rgba(255,196,120,0.35),rgba(224,96,74,0.12)_40%,transparent_70%)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.25] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, times: [0, 0.12, 1] }}
        />
      )}
    </AnimatePresence>
  )
}

export default function App() {
  useEffect(() => {
    const stopDirector = startDirector()
    // a shared link (?s=…) is fetched right away and opened from the title screen
    const sharedId = sharedIdFromUrl()
    if (sharedId) {
      fetchShare(sharedId)
        .then((share) => useChronos.getState().setPendingShare(share))
        .catch((error: Error) => useChronos.getState().setShareError(error.message))
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // let inputs handle their own Escape (clearing a search, etc.)
      if (e.target instanceof HTMLInputElement && e.target.type === 'search' && e.target.value) return
      useChronos.getState().back()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      stopDirector()
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <MotionConfig reducedMotion="user">
      <main className="relative h-full w-full">
        <div className="absolute inset-0 z-0">
          <Experience />
        </div>
        <div className="pointer-events-none absolute inset-0 z-10">
          <FractureVeil />
          <TitleScreen />
          <Hud />
          <CountrySearch />
          <ZonePanel />
          <EraPanel />
          <EventsPanel />
          <AlternatePanel />
          <ComparisonView />
          <SoundToggle />
          <Loader />
        </div>
        <CountryTooltip />
        <EventTooltip />
      </main>
    </MotionConfig>
  )
}
