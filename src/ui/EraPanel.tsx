import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { erasFor } from '../data/eras'
import { YEAR_MAX, YEAR_MIN, formatRange, formatYear, tToYear, yearToT } from '../lib/time'
import { selectedCountry, useChronos } from '../store/useChronos'

const SLIDER_STEPS = 2000

export function EraPanel() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const year = useChronos((s) => s.year)
  const setYear = useChronos((s) => s.setYear)
  const backToZone = useChronos((s) => s.backToZone)
  const explore = useChronos((s) => s.explore)
  const eras = useMemo(() => (country ? erasFor(country) : []), [country])

  // free typing: keep a draft until it parses into a valid year
  const [draft, setDraft] = useState(String(year))
  useEffect(() => setDraft(String(year)), [year])

  const commitDraft = () => {
    const n = Number.parseInt(draft, 10)
    if (Number.isFinite(n)) setYear(n)
    else setDraft(String(year))
  }

  return (
    <AnimatePresence>
      {phase === 'era' && country && (
        <motion.aside
          key="era"
          className="glass pointer-events-auto absolute right-4 bottom-4 left-4 flex max-h-[52vh] flex-col overflow-y-auto rounded-2xl p-5 sm:top-1/2 sm:right-8 sm:bottom-auto sm:left-auto sm:max-h-[80vh] sm:w-[23rem] sm:-translate-y-1/2 sm:p-6"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.2, 0.7, 0.2, 1] }}
        >
          <p className="font-mono text-[10px] tracking-[0.3em] text-real uppercase">Époque · {country.name}</p>

          <div className="mt-2 flex items-baseline gap-3">
            <motion.span
              key={year}
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-5xl leading-none font-medium tabular-nums sm:text-6xl"
            >
              {year < 0 ? -year : year}
            </motion.span>
            {year < 0 && <span className="font-display text-xl text-parchment/70 italic">av. J.-C.</span>}
          </div>

          <label className="sr-only" htmlFor="year-slider">
            Année
          </label>
          <input
            id="year-slider"
            type="range"
            min={0}
            max={SLIDER_STEPS}
            value={Math.round(yearToT(year) * SLIDER_STEPS)}
            onChange={(e) => setYear(tToYear(Number(e.target.value) / SLIDER_STEPS))}
            aria-valuetext={formatYear(year)}
            className="mt-5 w-full accent-[var(--color-alt)]"
          />
          <div className="mt-1 flex justify-between font-mono text-[9px] text-dust">
            <span>{formatYear(YEAR_MIN)}</span>
            <span>{YEAR_MAX}</span>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <label htmlFor="year-input" className="font-mono text-[10px] tracking-[0.2em] text-dust uppercase">
              Année exacte
            </label>
            <input
              id="year-input"
              type="number"
              inputMode="numeric"
              min={YEAR_MIN}
              max={YEAR_MAX}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commitDraft}
              onKeyDown={(e) => e.key === 'Enter' && commitDraft()}
              className="w-24 rounded-md border border-parchment/15 bg-transparent px-2 py-1 font-mono text-sm tabular-nums focus:border-real/60 focus:outline-none"
            />
            <span className="text-[11px] text-dust">négatif = av. J.-C.</span>
          </div>

          <div className="my-4 h-px shrink-0 bg-gradient-to-r from-real/40 via-parchment/10 to-transparent" />

          <p className="font-mono text-[10px] tracking-[0.3em] text-dust uppercase">Époques suggérées</p>
          <ul className="-mx-2 mt-2">
            {eras.map((era) => {
              const current = year >= era.start && year <= era.end
              return (
                <li key={era.label}>
                  <button
                    type="button"
                    onClick={() => setYear(era.focus)}
                    aria-pressed={current}
                    className={`flex w-full items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-parchment/5 focus-visible:outline-2 focus-visible:outline-real ${
                      current ? 'text-alt' : ''
                    }`}
                  >
                    <span className="text-sm">{era.label}</span>
                    <span className="shrink-0 font-mono text-[10px] text-dust tabular-nums">
                      {formatRange(era.start, era.end)}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>

          <div className="mt-4 flex shrink-0 flex-col gap-2">
            <button
              type="button"
              onClick={explore}
              className="rounded-full bg-alt/90 px-5 py-2.5 font-mono text-xs tracking-[0.2em] text-void uppercase transition-colors hover:bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alt"
            >
              Explorer {formatYear(year)} →
            </button>
            <button
              type="button"
              onClick={backToZone}
              className="rounded-full px-5 py-2 font-mono text-xs tracking-[0.2em] text-dust uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real"
            >
              ← Changer de zone <span className="opacity-50">(Échap)</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
