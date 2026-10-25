import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useT } from '../i18n'
import { useChronos } from '../store/useChronos'

/** Static site only, opened with Shift+K: sets the API key used from this browser. */
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

            <label htmlFor="api-key" className="mt-5 block font-mono text-[10px] tracking-[0.2em] text-dust uppercase">
              {t('key.field')}
            </label>
            <input
              ref={input}
              id="api-key"
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
