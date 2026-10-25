import { AnimatePresence, motion } from 'framer-motion'
import { useChronos } from '../store/useChronos'

const STEPS = ['Zone', 'Époque', 'Événements', 'Divergence']

export function Hud() {
  const phase = useChronos((s) => s.phase)
  if (phase === 'intro') return null
  const current = phase === 'era' ? 1 : 0

  return (
    <>
      <motion.header
        className="pointer-events-none absolute top-0 left-0 flex flex-col gap-3 p-5 sm:p-7"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.8 }}
      >
        <span className="font-display text-2xl tracking-[0.3em]">CHRONOS</span>
        <ol className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[10px] tracking-[0.2em] uppercase">
          {STEPS.map((s, i) => (
            <li key={s} className={i === current ? 'text-real' : 'text-dust/60'}>
              <span className="mr-1.5 opacity-60">{['I', 'II', 'III', 'IV'][i]}</span>
              {s}
            </li>
          ))}
        </ol>
      </motion.header>

      <AnimatePresence>
        {(phase === 'globe' || phase === 'era') && (
          <motion.p
            key={phase}
            className="pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 px-4 text-center font-mono text-[11px] tracking-[0.2em] text-dust uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {phase === 'globe'
              ? 'Faites tourner le globe · survolez un pays · cliquez pour le choisir'
              : 'Cliquez sur la spirale ou sur un repère pour choisir une année'}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}
