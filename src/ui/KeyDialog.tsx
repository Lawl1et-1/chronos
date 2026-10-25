import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { STATIC_SITE } from '../api/client'
import { useChronos } from '../store/useChronos'

const AI_STUDIO = 'https://aistudio.google.com/apikey'

/** Static site only: lets visitors use their own free Gemini key instead of the demo. */
export function KeyButton() {
  const phase = useChronos((s) => s.phase)
  const hasKey = useChronos((s) => !!s.geminiKey)
  const open = useChronos((s) => s.setKeyDialogOpen)
  if (!STATIC_SITE || phase === 'intro') return null
  return (
    <button
      type="button"
      onClick={() => open(true)}
      className="glass pointer-events-auto absolute bottom-4 left-16 flex h-10 items-center gap-2 rounded-full px-4 font-mono text-[10px] tracking-[0.2em] text-parchment/80 uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real max-sm:top-5 max-sm:right-16 max-sm:bottom-auto max-sm:left-auto sm:bottom-7 sm:left-20"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${hasKey ? 'bg-real' : 'bg-alt'}`} />
      {hasKey ? 'IA active' : 'Mode démo'}
    </button>
  )
}

export function KeyDialog() {
  const open = useChronos((s) => s.keyDialogOpen)
  const current = useChronos((s) => s.geminiKey)
  const setKey = useChronos((s) => s.setGeminiKey)
  const close = useChronos((s) => s.setKeyDialogOpen)
  const [value, setValue] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setValue('')
    const t = setTimeout(() => input.current?.focus(), 50)
    return () => clearTimeout(t)
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
            <p className="font-mono text-[10px] tracking-[0.3em] text-real uppercase">Intelligence artificielle</p>
            <h2 id="key-title" className="mt-2 font-display text-3xl leading-tight font-medium">
              Votre clé Gemini
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-parchment/75">
              Sans clé, CHRONOS montre une démonstration (Allemagne, 1939). Avec une clé Gemini{' '}
              <span className="text-parchment">gratuite</span>, explorez n'importe quelle zone et n'importe quelle
              époque.
            </p>
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-parchment/75">
              <li>
                Créez une clé sur{' '}
                <a href={AI_STUDIO} target="_blank" rel="noreferrer" className="text-real underline underline-offset-2">
                  Google AI Studio
                </a>
                .
              </li>
              <li>Collez-la ci-dessous.</li>
            </ol>

            <label htmlFor="gemini-key" className="mt-5 block font-mono text-[10px] tracking-[0.2em] text-dust uppercase">
              Clé API
            </label>
            <input
              ref={input}
              id="gemini-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={current ? 'Une clé est enregistrée — en coller une autre' : 'Collez votre clé ici'}
              className="mt-1.5 w-full rounded-lg border border-parchment/15 bg-transparent px-3 py-2 font-mono text-sm focus:border-real/60 focus:outline-none"
            />
            <p className="mt-2 text-xs leading-relaxed text-dust">
              La clé reste dans ce navigateur et n'est envoyée qu'à Google. Sur l'offre gratuite, Google peut
              utiliser les requêtes pour améliorer ses produits.
            </p>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={!value.trim()}
                className="rounded-full bg-real/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-real focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-real disabled:opacity-40"
              >
                Enregistrer
              </button>
              {current && (
                <button
                  type="button"
                  onClick={() => setKey(null)}
                  className="rounded-full px-4 py-2.5 font-mono text-xs tracking-[0.2em] text-rupture uppercase hover:underline"
                >
                  Retirer la clé
                </button>
              )}
              <button
                type="button"
                onClick={() => close(false)}
                className="ml-auto rounded-full px-4 py-2.5 font-mono text-xs tracking-[0.2em] text-dust uppercase hover:text-parchment"
              >
                Fermer
              </button>
            </div>
          </motion.form>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
