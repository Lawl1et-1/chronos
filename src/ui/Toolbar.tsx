import { motion } from 'framer-motion'
import { useLang, useT, type Lang } from '../i18n'
import { SoundToggle } from './SoundToggle'

const LANGS: Lang[] = ['fr', 'en']

/** FR | EN switch; the choice is remembered in this browser. */
function LangSwitch() {
  const lang = useLang((s) => s.lang)
  const setLang = useLang((s) => s.setLang)
  const t = useT()
  return (
    <div role="group" aria-label={t('lang.label')} className="glass flex h-10 items-center rounded-full p-1">
      {LANGS.map((l) => (
        <button
          key={l}
          type="button"
          lang={l}
          aria-pressed={lang === l}
          title={lang === l ? undefined : t('lang.switchTo')}
          onClick={() => setLang(l)}
          className={`h-8 rounded-full px-3 font-mono text-[11px] tracking-[0.15em] uppercase transition-colors focus-visible:outline-2 focus-visible:outline-real ${
            lang === l ? 'bg-parchment/15 text-parchment' : 'text-dust hover:text-parchment'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

/** Top-right controls: sound and language. */
export function Toolbar() {
  return (
    <motion.div
      className="pointer-events-auto absolute top-5 right-4 z-20 flex items-center gap-2 sm:top-7 sm:right-7"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.6 }}
    >
      <SoundToggle />
      <LangSwitch />
    </motion.div>
  )
}
