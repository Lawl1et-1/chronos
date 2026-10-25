import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { KeyEvent } from '../../shared/schemas'
import { formatRange, formatYear } from '../lib/time'
import { selectedCountry, useChronos } from '../store/useChronos'

function ImpactBar({ score }: { score: number }) {
  return (
    <span className="flex gap-[3px]" aria-label={`Impact historique ${score} sur 10`}>
      {Array.from({ length: 10 }, (_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-[1px] ${i < score ? 'bg-alt' : 'bg-parchment/12'}`} />
      ))}
    </span>
  )
}

const panelMotion = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 40 },
  transition: { duration: 0.5, ease: [0.2, 0.7, 0.2, 1] as const },
}

const ghostButton =
  'rounded-full px-5 py-2 font-mono text-xs tracking-[0.2em] text-dust uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real'

export function EventsPanel() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const year = useChronos((s) => s.year)
  const keyEvents = useChronos((s) => s.keyEvents)
  const hoveredEvent = useChronos((s) => s.hoveredEvent)
  const selectedEvent = useChronos((s) => s.selectedEvent)
  const { hoverEvent, selectEvent, loadKeyEvents, back } = useChronos.getState()

  const data = keyEvents.status === 'ready' ? keyEvents.data : null
  const detail = data?.events.find((e) => e.id === selectedEvent) ?? null
  const view = phase !== 'events' ? null : detail ? `detail-${detail.id}` : keyEvents.status

  return (
    <AnimatePresence mode="wait">
      {view && country && (
        <motion.aside
          key={view}
          {...panelMotion}
          className="glass pointer-events-auto absolute right-4 bottom-4 left-4 flex max-h-[50vh] flex-col overflow-y-auto rounded-2xl p-5 sm:top-1/2 sm:right-8 sm:bottom-auto sm:left-auto sm:max-h-[84vh] sm:w-[24rem] sm:-translate-y-1/2 sm:p-6"
          aria-live="polite"
        >
          <p className="font-mono text-[10px] tracking-[0.3em] text-real uppercase">
            {(data?.zone.name ?? country.name) + ' · ' + formatYear(data?.year ?? year)}
          </p>

          {keyEvents.status === 'loading' && (
            <>
              <h2 className="mt-3 font-display text-3xl font-medium">Consultation des archives…</h2>
              <p className="mt-3 text-sm leading-relaxed text-parchment/70">
                Sélection des cinq événements qui ont façonné cette période — et ce qui a suivi. Cela peut prendre une
                trentaine de secondes.
              </p>
              <div className="relative mt-6 h-px overflow-hidden bg-parchment/10">
                <motion.div
                  className="absolute inset-y-0 w-1/3 bg-real"
                  animate={{ x: ['-100%', '300%'] }}
                  transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <button type="button" onClick={back} className={`${ghostButton} mt-6 self-start px-0`}>
                ← Changer d'époque
              </button>
            </>
          )}

          {keyEvents.status === 'error' && (
            <>
              <h2 className="mt-3 font-display text-3xl font-medium">Les archives restent muettes</h2>
              <p className="mt-3 text-sm leading-relaxed text-rupture" role="alert">
                {keyEvents.message}
              </p>
              <div className="mt-6 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void loadKeyEvents()}
                  className="rounded-full bg-real/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-real focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-real"
                >
                  Réessayer
                </button>
                <button type="button" onClick={back} className={ghostButton}>
                  ← Changer d'époque
                </button>
              </div>
            </>
          )}

          {data && !detail && (
            <>
              <h2 className="mt-2 font-display text-3xl leading-tight font-medium">{data.period.label}</h2>
              <p className="mt-1 font-mono text-[10px] text-dust">
                {formatRange(data.period.start, data.period.end)}
              </p>
              {data.demo && (
                <p className="mt-3 rounded-md border border-alt/40 px-3 py-2 text-xs text-alt">
                  Mode démo : données d'exemple (Allemagne, 1939), sans appel à l'IA.
                </p>
              )}
              <p className="mt-3 text-sm leading-relaxed text-parchment/75">{data.context}</p>

              <p className="mt-5 font-mono text-[10px] tracking-[0.3em] text-dust uppercase">
                Les 5 événements déterminants
              </p>
              <ol className="-mx-2 mt-2">
                {data.events.map((event, i) => (
                  <li key={event.id}>
                    <button
                      type="button"
                      onMouseEnter={() => hoverEvent(event.id)}
                      onMouseLeave={() => hoverEvent(null)}
                      onFocus={() => hoverEvent(event.id)}
                      onBlur={() => hoverEvent(null)}
                      onClick={() => selectEvent(event.id)}
                      className={`flex w-full gap-3 rounded-lg px-2 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-real ${
                        hoveredEvent === event.id ? 'bg-parchment/6' : ''
                      }`}
                    >
                      <span className="pt-0.5 font-mono text-[11px] text-real">{String(i + 1).padStart(2, '0')}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug">{event.title}</span>
                        <span className="mt-1 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] text-dust">{event.date}</span>
                          <ImpactBar score={event.impactScore} />
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ol>

              <p className="mt-4 text-[11px] leading-relaxed text-dust">
                Sélection générée par IA à partir de faits historiques. Vérifiez les points importants.
              </p>
              <button type="button" onClick={back} className={`${ghostButton} mt-3 self-start px-0`}>
                ← Changer d'époque <span className="opacity-50">(Échap)</span>
              </button>
            </>
          )}

          {detail && <EventDetail event={detail} index={data!.events.indexOf(detail)} onBack={back} />}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function EventDetail({ event, index, onBack }: { event: KeyEvent; index: number; onBack: () => void }) {
  const alteration = useChronos((s) => s.alteration)
  const fracturing = useChronos((s) => s.fracturing)
  const rewrite = useChronos((s) => s.rewrite)
  return (
    <>
      <div className="mt-3 flex items-baseline justify-between gap-3">
        <span className="font-mono text-[11px] text-real">{String(index + 1).padStart(2, '0')}</span>
        <span className="font-mono text-[11px] text-dust">{event.date}</span>
      </div>
      <h2 className="mt-1 font-display text-3xl leading-tight font-medium">{event.title}</h2>
      <div className="mt-3 flex items-center gap-3">
        <ImpactBar score={event.impactScore} />
        <span className="font-mono text-[11px] text-alt">{event.impactScore}/10</span>
      </div>
      <p className="mt-4 text-sm leading-relaxed text-parchment/85">{event.summary}</p>

      <h3 className="mt-5 font-mono text-[10px] tracking-[0.3em] text-dust uppercase">Pourquoi c'est déterminant</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-parchment/75">{event.whyItMattered}</p>

      <h3 className="mt-4 font-mono text-[10px] tracking-[0.3em] text-dust uppercase">Impact à long terme</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-parchment/75">{event.longTermImpact}</p>

      <AlterationPicker event={event} />

      <div className="mt-5 flex shrink-0 flex-col gap-2">
        <button
          type="button"
          onClick={rewrite}
          disabled={!alteration || fracturing}
          className="rounded-full bg-alt/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alt disabled:cursor-not-allowed disabled:opacity-40"
        >
          Réécrire l'histoire →
        </button>
        <button type="button" onClick={onBack} className={ghostButton}>
          ← Les 5 événements <span className="opacity-50">(Échap)</span>
        </button>
      </div>
    </>
  )
}

const FREE_MAX = 300

/** The three suggested alterations plus a free one, as a single choice. */
function AlterationPicker({ event }: { event: KeyEvent }) {
  const alteration = useChronos((s) => s.alteration)
  const setAlteration = useChronos((s) => s.setAlteration)
  const [free, setFree] = useState('')
  const isFree = !!alteration && !event.possibleAlterations.some((a) => a.title === alteration.title)

  const option = (active: boolean) =>
    `w-full rounded-lg border px-3 py-2 text-left transition-colors focus-visible:outline-2 focus-visible:outline-alt ${
      active ? 'border-alt/70 bg-alt/10' : 'border-parchment/10 hover:border-parchment/25'
    }`

  return (
    <fieldset className="mt-5">
      <legend className="font-mono text-[10px] tracking-[0.3em] text-alt uppercase">Et si… choisissez la modification</legend>
      <div className="mt-2 flex flex-col gap-2" role="radiogroup">
        {event.possibleAlterations.map((alt) => {
          const active = alteration?.title === alt.title
          return (
            <button
              key={alt.title}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAlteration(alt)}
              className={option(active)}
            >
              <span className={`block text-sm ${active ? 'text-alt' : ''}`}>{alt.title}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-dust">{alt.description}</span>
            </button>
          )
        })}
        <label className={`${option(isFree)} block cursor-text`}>
          <span className={`block text-sm ${isFree ? 'text-alt' : ''}`}>Votre propre hypothèse</span>
          <textarea
            rows={2}
            maxLength={FREE_MAX}
            value={free}
            placeholder="Et si…"
            onChange={(e) => {
              setFree(e.target.value)
              const text = e.target.value.trim()
              setAlteration(text.length >= 3 ? { title: text, description: '' } : null)
            }}
            onFocus={() => {
              const text = free.trim()
              if (text.length >= 3) setAlteration({ title: text, description: '' })
            }}
            className="mt-1 w-full resize-none bg-transparent text-sm placeholder:text-dust/70 focus:outline-none"
          />
        </label>
      </div>
    </fieldset>
  )
}
