import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { STATIC_SITE } from '../api/client'
import { useT } from '../i18n'
import { useChronos } from '../store/useChronos'

const AI_STUDIO = 'https://aistudio.google.com/apikey'

/** Static site only: lets visitors use their own free Gemini key instead of the demo. */
export function KeyButton() {
  const phase = useChronos((s) => s.phase)
  const hasKey = useChronos((s) => !!s.geminiKey)
  const open = useChronos((s) => s.setKeyDialogOpen)
  const t = useT()
  if (!STATIC_SITE || phase === 'intro') return null
  const label = hasKey ? t('key.live') : t('key.demo')
  return (
    <button
      type="button"
      onClick={() => open(true)}
      title={label}
      className="glass flex h-10 items-center gap-2 rounded-full px-4 font-mono text-[10px] tracking-[0.2em] text-parchment/80 uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real max-sm:w-10 max-sm:justify-center max-sm:px-0"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${hasKey ? 'bg-real' : 'bg-alt'}`} />
      <span className="max-sm:sr-only">{label}</span>
    </button>
  )
}

export function KeyDialog() {
  const open = useChronos((s) => s.keyDialogOpen)
  const current = useChronos((s) => s.geminiKey)
  const setKey = useChronos((s) => s.setGeminiKey)
  const close = useChronos((s) => s.setKeyDialogOpen)
  const t = useT()
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    const timer = setTimeout(() => input.current?.focus(), 50)
    return () => clearTimeout(timer)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="key"
          className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && close(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="key-title"
        >
          <motion.form
            className="glass w-full max-w-md rounded-2xl p-6"
            initial={{ y: 16 }}
            animate={{ y: 0 }}
            onSubmit={(e) => {
              e.preventDefault()
              if (value.trim()) setKey(value.trim())
            }}
          >
            <p className="font-mono text-[10px] tracking-[0.3em] text-real uppercase">{t('key.kicker')}</p>
            <h2 id="key-title" className="mt-2 font-display text-3xl leading-tight font-medium">
              {t('key.title')}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment/75">{t('key.intro')}</p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-parchment/75">
              <li>
                {t('key.step1')}{' '}
                <a href={AI_STUDIO} target="_blank" rel="noreferrer" className="text-real underline underline-offset-2">
                  Google AI Studio
                </a>
                .
              </li>
              <li>{t('key.step2')}</li>
            </ol>

            <label htmlFor="gemini-key" className="mt-5 block font-mono text-[10px] tracking-[0.2em] text-dust uppercase">
              {t('key.field')}
            </label>
            <input
              ref={input}
              id="gemini-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current ? t('key.placeholderSaved') : t('key.placeholder')}
              className="mt-1.5 w-full rounded-lg border border-parchment/15 bg-transparent px-3 py-2 font-mono text-sm focus:border-real/60 focus:outline-none"
            />
            <p className="mt-2 text-xs leading-relaxed text-dust">{t('key.privacy')}</p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={!value.trim()}
                className="rounded-full bg-real/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-real focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-real disabled:opacity-40"
              >
                {t('key.save')}
              </button>
              {current && (
                <button
                  type="button"
                  onClick={() => setKey(null)}
                  className="rounded-full px-4 py-2.5 font-mono text-xs tracking-[0.2em] text-rupture uppercase hover:underline"
                >
                  {t('key.remove')}
                </button>
              )}
              <button
                type="button"
                onClick={() => close(false)}
                className="ml-auto rounded-full px-4 py-2.5 font-mono text-xs tracking-[0.2em] text-dust uppercase hover:text-parchment"
              >
                {t('common.close')}
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
