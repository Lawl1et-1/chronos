import { AnimatePresence, motion } from 'framer-motion'
import { useChronos } from '../store/useChronos'
import { useT, type MessageKey } from '../i18n'

const STEPS: MessageKey[] = ['step.zone', 'step.era', 'step.events', 'step.divergence']

export function Hud() {
  const phase = useChronos((s) => s.phase)
  const t = useT()
  if (phase === 'intro') return null
  const current = phase === 'alternate' ? 3 : phase === 'events' ? 2 : phase === 'era' ? 1 : 0

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
              {t(s)}
            </li>
          ))}
        </ol>
      </motion.header>

      <AnimatePresence>
        {phase !== 'zone' && (
          <motion.p
            key={phase}
            className={`pointer-events-none absolute bottom-6 left-1/2 -translate-x-1/2 px-4 text-center font-mono text-[11px] tracking-[0.2em] text-dust uppercase ${phase === 'globe' ? '' : 'hidden sm:block'}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
          >
            {t(
              phase === 'globe'
                ? 'hint.globe'
                : phase === 'era'
                  ? 'hint.era'
                  : phase === 'events'
                    ? 'hint.events'
                    : 'hint.alternate',
            )}
          </motion.p>
        )}
      </AnimatePresence>
    </>
  )
}
