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
import { Toolbar } from './ui/Toolbar'
import { ComparisonView } from './ui/ComparisonView'
import { KeyDialog } from './ui/KeyDialog'
import { ApiRequestError, STATIC_SITE, sharedFromUrl } from './api/client'
import { errorText, translate } from './i18n'

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
    // a shared link is loaded right away and opened from the title screen
    sharedFromUrl()
      ?.then((share) => useChronos.getState().setPendingShare(share))
      .catch((error: Error) =>
        useChronos
          .getState()
          .setShareError(error instanceof ApiRequestError ? errorText(error.code, error.message) : translate('share.invalid')),
      )
    const onKey = (e: KeyboardEvent) => {
      // hidden entry to the API key screen on the static site
      if (STATIC_SITE && e.key === 'K' && e.shiftKey && !(e.target instanceof HTMLInputElement)) {
        useChronos.getState().setKeyDialogOpen(true)
        return
      }
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
          <Toolbar />
          <KeyDialog />
          <Loader />
        </div>
        <CountryTooltip />
        <EventTooltip />
      </main>
    </MotionConfig>
  )
}
