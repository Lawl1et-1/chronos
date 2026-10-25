import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'framer-motion'

export function Loader() {
  const { active, progress } = useProgress()
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="pointer-events-none absolute bottom-8 left-1/2 w-48 -translate-x-1/2"
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="h-px w-full bg-parchment/10">
            <div className="h-px bg-real transition-[width] duration-300" style={{ width: `${progress}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
