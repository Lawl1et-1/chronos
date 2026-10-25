import { AnimatePresence, motion } from 'framer-motion'
import { useChronos } from '../store/useChronos'

const LETTERS = 'CHRONOS'.split('')

export function TitleScreen() {
  const phase = useChronos((s) => s.phase)
  const ready = useChronos((s) => s.countries.length > 0)
  const enter = useChronos((s) => s.enter)

  return (
    <AnimatePresence>
      {phase === 'intro' && (
        <motion.section
          key="title"
          className="pointer-events-none absolute inset-0 isolate flex flex-col items-center justify-center px-6 text-center"
          exit={{ opacity: 0, scale: 1.04, filter: 'blur(8px)' }}
          transition={{ duration: 0.9, ease: [0.4, 0, 0.2, 1] }}
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_55%_40%_at_50%_50%,rgba(2,3,8,0.72),transparent_75%)]"
          />
          <motion.p
            className="font-mono text-[11px] tracking-[0.5em] text-real/80 uppercase"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 1 }}
          >
            Simulateur d'histoire alternative
          </motion.p>

          <h1 className="mt-5 flex font-display text-[clamp(4rem,13vw,10rem)] leading-none font-medium tracking-[0.12em]">
            {LETTERS.map((l, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 30, filter: 'blur(12px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ delay: 0.5 + i * 0.09, duration: 1.1, ease: [0.2, 0.7, 0.2, 1] }}
                className="drop-shadow-[0_0_30px_rgba(127,208,255,0.25)]"
              >
                {l}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-md font-display text-xl text-parchment/75 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1.2 }}
          >
            Choisissez un lieu, une époque, un événement. Puis changez-le.
          </motion.p>

          <motion.button
            type="button"
            onClick={enter}
            disabled={!ready}
            className="pointer-events-auto mt-12 rounded-full border border-parchment/25 px-8 py-3 font-mono text-xs tracking-[0.35em] uppercase transition-colors hover:border-real/70 hover:bg-real/10 hover:text-real focus-visible:outline-2 focus-visible:outline-real disabled:cursor-wait disabled:opacity-40"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 0.8 }}
          >
            {ready ? 'Entrer' : 'Chargement…'}
          </motion.button>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
