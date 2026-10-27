import { motion } from 'framer-motion'
import type { AlternateResponse, Impact } from '../../shared/schemas'
import { impactTone, timelineStats } from '../lib/impact'
import { useT, type MessageKey } from '../i18n'

const DIMENSIONS: [keyof Impact['dimensions'], MessageKey][] = [
  ['politics', 'impact.politics'],
  ['economy', 'impact.economy'],
  ['society', 'impact.society'],
  ['culture', 'impact.culture'],
  ['geopolitics', 'impact.geopolitics'],
]

const TONE = {
  real: { text: 'text-real', bar: 'bg-real', stroke: 'var(--color-real)' },
  alt: { text: 'text-alt', bar: 'bg-alt', stroke: 'var(--color-alt)' },
  rupture: { text: 'text-rupture', bar: 'bg-rupture', stroke: 'var(--color-rupture)' },
}

/** Ring gauge for a 0–100 score. */
function Gauge({ score, stroke }: { score: number; stroke: string }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden className="shrink-0 -rotate-90">
      <circle cx="36" cy="36" r={r} fill="none" stroke="currentColor" strokeWidth="5" className="text-parchment/10" />
      <motion.circle
        cx="36"
        cy="36"
        r={r}
        fill="none"
        stroke={stroke}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - score / 100) }}
        transition={{ duration: 1.2, ease: [0.2, 0.7, 0.2, 1] }}
      />
    </svg>
  )
}

/** How much the change matters: the model's calibrated score plus measured footprint. */
export function ImpactCard({ data }: { data: AlternateResponse }) {
  const t = useT()
  const stats = timelineStats(data)
  const impact = data.impact
  const tone = TONE[impactTone(impact?.score ?? 0)]

  return (
    <section className="mt-5 rounded-xl border border-parchment/10 bg-parchment/[0.03] p-4" aria-label={t('impact.title')}>
      <h3 className="font-mono text-[10px] tracking-[0.3em] text-dust uppercase">{t('impact.title')}</h3>

      {impact && (
        <>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative">
              <Gauge score={impact.score} stroke={tone.stroke} />
              <span className={`absolute inset-0 flex items-center justify-center font-display text-2xl font-medium tabular-nums ${tone.text}`}>
                {impact.score}
              </span>
            </div>
            <div className="min-w-0">
              <p className={`font-display text-xl leading-tight font-medium ${tone.text}`}>{impact.verdict}</p>
              <p className="mt-1 text-xs leading-relaxed text-parchment/75">{impact.summary}</p>
            </div>
          </div>

          <ul className="mt-4 flex flex-col gap-1.5">
            {DIMENSIONS.map(([key, label]) => (
              <li key={key} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-parchment/70">{t(label)}</span>
                <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-parchment/10">
                  <motion.span
                    className={`absolute inset-y-0 left-0 rounded-full ${tone.bar}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${impact.dimensions[key] * 10}%` }}
                    transition={{ duration: 0.9, delay: 0.2 }}
                  />
                </span>
                <span className="w-6 text-right font-mono text-[10px] text-dust tabular-nums">{impact.dimensions[key]}</span>
              </li>
            ))}
          </ul>
        </>
      )}

      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          [String(stats.countries), t('impact.countries')],
          [String(stats.years), t('impact.years')],
          [`${stats.confidence} %`, t('impact.confidence')],
        ].map(([value, label]) => (
          // label first for screen readers, shown under the value
          <div key={label} className="flex flex-col-reverse rounded-lg border border-parchment/10 px-2 py-2">
            <dt className="mt-1 font-mono text-[9px] leading-tight tracking-[0.1em] text-dust uppercase">{label}</dt>
            <dd className="font-display text-xl leading-none tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>

      {impact && <p className="mt-3 text-[10px] leading-relaxed text-dust">{t('impact.scale')}</p>}
    </section>
  )
}
