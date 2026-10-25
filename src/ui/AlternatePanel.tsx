import { AnimatePresence, motion } from 'framer-motion'
import type { AlternatePartial, AlternateResponse, TimelineNode } from '../../shared/schemas'
import { formatYear } from '../lib/time'
import { selectedCountry, useChronos } from '../store/useChronos'

const ghostButton =
  'rounded-full px-5 py-2 font-mono text-xs tracking-[0.2em] text-dust uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real'
const heading = 'font-mono text-[10px] tracking-[0.3em] uppercase'

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  return (
    <span className="flex items-center gap-2" aria-label={`Confiance ${pct} %`}>
      <span className="relative h-1 w-16 overflow-hidden rounded-full bg-parchment/10">
        <span className="absolute inset-y-0 left-0 rounded-full bg-alt" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[10px] text-dust tabular-nums">{pct} %</span>
    </span>
  )
}

export function AlternatePanel() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const alternate = useChronos((s) => s.alternate)
  const alteration = useChronos((s) => s.alteration)
  const selectedNode = useChronos((s) => s.selectedNode)
  const { selectNode, back, loadAlternate, clearSelection } = useChronos.getState()

  const content: AlternateResponse | AlternatePartial | null =
    alternate.status === 'ready' ? alternate.data : alternate.status === 'idle' ? null : alternate.partial
  const nodes = content?.timeline ?? []
  const node = selectedNode !== null ? nodes[selectedNode] : undefined
  const data = alternate.status === 'ready' ? alternate.data : null
  const view = phase !== 'alternate' ? null : node ? `node-${selectedNode}` : 'overview'

  return (
    <AnimatePresence mode="wait">
      {view && country && alteration && (
        <motion.aside
          key={view}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="glass pointer-events-auto absolute right-4 bottom-4 left-4 flex max-h-[48vh] flex-col overflow-y-auto rounded-2xl p-5 sm:top-1/2 sm:right-8 sm:bottom-auto sm:left-auto sm:max-h-[86vh] sm:w-[25rem] sm:-translate-y-1/2 sm:p-6"
        >
          <p className="self-start rounded-full border border-rupture/50 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.25em] text-rupture uppercase">
            Chronologie spéculative{data?.demo ? ' · démo' : ''}
          </p>

          {node ? (
            <NodeDetail node={node} index={selectedNode!} count={nodes.length} onSelect={selectNode} />
          ) : (
            <>
              <p className={`${heading} mt-4 text-alt`}>Et si…</p>
              <h2 className="mt-1 font-display text-3xl leading-tight font-medium">{alteration.title}</h2>

              {alternate.status === 'streaming' && (
                <div className="mt-4" aria-live="polite">
                  <p className="text-sm text-parchment/70">
                    {nodes.length
                      ? `Reconstruction de la chronologie… ${nodes.length} jalon${nodes.length > 1 ? 's' : ''}`
                      : content?.divergencePoint
                        ? 'Enchaînement des causes et des conséquences…'
                        : "L'IA raisonne sur les contraintes de l'époque…"}
                  </p>
                  <div className="relative mt-2 h-px overflow-hidden bg-parchment/10">
                    <motion.div
                      className="absolute inset-y-0 w-1/3 bg-alt"
                      animate={{ x: ['-100%', '300%'] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              )}

              {alternate.status === 'error' && (
                <div className="mt-4" role="alert">
                  <p className="text-sm text-rupture">{alternate.message}</p>
                  <button
                    type="button"
                    onClick={() => void loadAlternate()}
                    className="mt-3 rounded-full bg-alt/90 px-5 py-2 font-mono text-xs tracking-[0.2em] text-void uppercase hover:bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alt"
                  >
                    Réessayer
                  </button>
                </div>
              )}

              {content?.divergencePoint && (
                <section className="mt-5">
                  <h3 className={`${heading} text-rupture`}>
                    Point de divergence · {formatYear(content.divergencePoint.year)}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium">{content.divergencePoint.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-parchment/75">{content.divergencePoint.description}</p>
                </section>
              )}

              {content?.butterflyEffects && (
                <section className="mt-5">
                  <h3 className={`${heading} text-dust`}>Effet papillon</h3>
                  <ol className="mt-2 flex flex-col">
                    {content.butterflyEffects.map((link, i) => (
                      <li key={i} className="relative border-l border-alt/30 pb-3 pl-4 last:pb-0">
                        <span className="absolute top-1.5 -left-[3px] h-1.5 w-1.5 rounded-full bg-alt" />
                        <p className="text-xs text-parchment/60">{link.cause}</p>
                        <p className="mt-0.5 text-sm leading-snug">→ {link.effect}</p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {nodes.length > 0 && (
                <section className="mt-5">
                  <h3 className={`${heading} text-dust`}>Jalons de la branche</h3>
                  <ol className="-mx-2 mt-2">
                    {nodes.map((n, i) => (
                      <li key={i}>
                        <button
                          type="button"
                          onClick={() => selectNode(i)}
                          className="flex w-full items-baseline gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-parchment/5 focus-visible:outline-2 focus-visible:outline-alt"
                        >
                          <span className="w-16 shrink-0 font-mono text-[11px] text-alt tabular-nums">
                            {formatYear(n.year)}
                          </span>
                          <span className="min-w-0 flex-1 text-sm leading-snug">{n.title}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              )}

              {data && (
                <>
                  <section className="mt-5">
                    <h3 className={`${heading} text-alt`}>Le monde en 2025</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-parchment/80">{data.worldIn2025}</p>
                  </section>
                  <section className="mt-5 rounded-lg border border-parchment/10 p-3">
                    <h3 className={`${heading} text-dust`}>Plausibilité</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-parchment/70">{data.plausibilityNote}</p>
                  </section>
                </>
              )}

              <p className="mt-5 text-[11px] leading-relaxed text-dust">
                Scénario hypothétique généré par IA. Les comparaisons « dans la réalité » s'appuient sur des faits ;
                tout le reste est spéculatif.
              </p>
              <div className="mt-3 flex flex-wrap gap-x-2">
                <button type="button" onClick={back} className={`${ghostButton} px-0`}>
                  ← Autre modification
                </button>
                <button type="button" onClick={clearSelection} className={ghostButton}>
                  Nouvelle zone
                </button>
              </div>
            </>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function NodeDetail({
  node,
  index,
  count,
  onSelect,
}: {
  node: TimelineNode
  index: number
  count: number
  onSelect: (i: number | null) => void
}) {
  return (
    <>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <span className="font-display text-4xl leading-none font-medium text-alt tabular-nums">
          {formatYear(node.year)}
        </span>
        <Confidence value={node.confidence} />
      </div>
      <h2 className="mt-2 font-display text-2xl leading-tight font-medium">{node.title}</h2>
      <p className="mt-3 text-sm leading-relaxed text-parchment/85">{node.description}</p>

      <section className="mt-4 rounded-lg border border-real/30 bg-real/5 p-3">
        <h3 className={`${heading} text-real`}>Dans la réalité</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-parchment/80">{node.realHistoryComparison}</p>
      </section>

      {node.affectedRegions.length > 0 && (
        <section className="mt-4">
          <h3 className={`${heading} text-dust`}>Régions concernées</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {node.affectedRegions.map((r) => (
              <li key={r.name} className="rounded-full border border-rupture/40 px-2.5 py-0.5 text-xs text-parchment/85">
                {r.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onSelect(index - 1)}
          className={`${ghostButton} px-0 disabled:opacity-30`}
        >
          ← Précédent
        </button>
        <span className="font-mono text-[10px] text-dust">
          {index + 1} / {count}
        </span>
        <button
          type="button"
          disabled={index === count - 1}
          onClick={() => onSelect(index + 1)}
          className={`${ghostButton} px-0 disabled:opacity-30`}
        >
          Suivant →
        </button>
      </div>
      <button type="button" onClick={() => onSelect(null)} className={`${ghostButton} mt-2 self-start px-0`}>
        ← Vue d'ensemble <span className="opacity-50">(Échap)</span>
      </button>
    </>
  )
}
