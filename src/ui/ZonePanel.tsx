import { AnimatePresence, motion } from 'framer-motion'
import { formatLatLon } from '../lib/geo'
import { selectedCountry, useChronos } from '../store/useChronos'

export function ZonePanel() {
  const country = useChronos(selectedCountry)
  const phase = useChronos((s) => s.phase)
  const clearSelection = useChronos((s) => s.clearSelection)
  const openEra = useChronos((s) => s.openEra)

  return (
    <AnimatePresence mode="wait">
      {phase === 'zone' && country && (
        <motion.aside
          key={country.index}
          className="glass pointer-events-auto absolute right-4 bottom-4 left-4 rounded-2xl p-6 sm:top-1/2 sm:right-8 sm:bottom-auto sm:left-auto sm:w-[22rem] sm:-translate-y-1/2"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="font-mono text-[10px] tracking-[0.3em] text-alt uppercase">Zone sélectionnée</p>
          <h2 className="mt-3 font-display text-4xl leading-tight font-medium">{country.name}</h2>
          <p className="mt-2 font-mono text-xs text-dust">{formatLatLon(country.center[0], country.center[1])}</p>

          <div className="my-6 h-px bg-gradient-to-r from-alt/50 via-parchment/10 to-transparent" />

          <p className="text-sm leading-relaxed text-parchment/70">
            Prochaine étape : choisir une époque sur la spirale du temps, puis découvrir les cinq événements qui l'ont
            façonnée.
          </p>

          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              onClick={openEra}
              className="rounded-full bg-alt/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alt"
            >
              Choisir une époque →
            </button>
            <button
              type="button"
              onClick={clearSelection}
              className="rounded-full px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-dust uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real"
            >
              ← Retour au globe <span className="opacity-50">(Échap)</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
