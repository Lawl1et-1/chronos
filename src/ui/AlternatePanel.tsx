import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { TimelineNode } from '../../shared/schemas'
import { formatYear } from '../lib/time'
import {
  MAX_DEPTH,
  activeBranchOf,
  branchContent,
  branchDepth,
  branchLabel,
  branchPath,
  selectedCountry,
  useChronos,
  type Branch,
} from '../store/useChronos'
import { ShareButton } from './ShareButton'
import { ImpactCard } from './ImpactCard'
import { useT } from '../i18n'

const ghostButton =
  'rounded-full px-5 py-2 font-mono text-xs tracking-[0.2em] text-dust uppercase transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real'
const heading = 'font-mono text-[10px] tracking-[0.3em] uppercase'

function Confidence({ value }: { value: number }) {
  const pct = Math.round(value * 100)
  const t = useT()
  return (
    <span className="flex items-center gap-2" aria-label={t('alt.confidence', { pct })}>
      <span className="relative h-1 w-16 overflow-hidden rounded-full bg-parchment/10">
        <span className="absolute inset-y-0 left-0 rounded-full bg-alt" style={{ width: `${pct}%` }} />
      </span>
      <span className="font-mono text-[10px] text-dust tabular-nums">{pct} %</span>
    </span>
  )
}

/** Réalité › Branche 1 › Branche 1.2 — each step switches to that branch. */
function Breadcrumb({ branch }: { branch: Branch }) {
  const branches = useChronos((s) => s.branches)
  const setActiveBranch = useChronos((s) => s.setActiveBranch)
  const t = useT()
  const path = branchPath(branches, branch)
  if (path.length < 2) return null
  return (
    <nav aria-label={t('alt.branchesNav')} className="mt-3 flex flex-wrap items-center gap-1 font-mono text-[10px] text-dust">
      {path.map((b, i) => (
        <span key={b.id} className="flex items-center gap-1">
          {i > 0 && <span aria-hidden>›</span>}
          {b.id === branch.id ? (
            <span className="text-parchment">{branchLabel(b.id)}</span>
          ) : (
            <button type="button" onClick={() => setActiveBranch(b.id)} className="hover:text-parchment">
              {branchLabel(b.id)}
            </button>
          )}
        </span>
      ))}
    </nav>
  )
}

export function AlternatePanel() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const branch = useChronos(activeBranchOf)
  const branches = useChronos((s) => s.branches)
  const selectedNode = useChronos((s) => s.selectedNode)
  const { selectNode, back, loadBranch, clearSelection, setComparing, setActiveBranch } = useChronos.getState()
  const t = useT()

  const content = branch ? branchContent(branch) : null
  const nodes = content?.timeline ?? []
  const node = selectedNode !== null ? nodes[selectedNode] : undefined
  const data = branch?.data ?? null
  const view = phase !== 'alternate' || !branch ? null : node ? `${branch.id}-node-${selectedNode}` : `${branch.id}-overview`
  const children = branch ? branches.filter((b) => b.parentId === branch.id) : []

  return (
    <AnimatePresence mode="wait">
      {view && country && branch && (
        <motion.aside
          key={view}
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 40 }}
          transition={{ duration: 0.45, ease: [0.2, 0.7, 0.2, 1] }}
          className="glass pointer-events-auto absolute right-4 bottom-4 left-4 flex max-h-[48vh] flex-col overflow-y-auto rounded-2xl p-5 sm:top-[calc(50%+1.75rem)] sm:right-8 sm:bottom-auto sm:left-auto sm:max-h-[calc(100vh-8rem)] sm:w-[25rem] sm:-translate-y-1/2 sm:p-6"
        >
          <p className="self-start rounded-full border border-rupture/50 px-2.5 py-0.5 font-mono text-[9px] tracking-[0.25em] text-rupture uppercase">
            {t('alt.speculative')}
          </p>
          <Breadcrumb branch={branch} />

          {node ? (
            <NodeDetail
              branch={branch}
              node={node}
              index={selectedNode!}
              count={nodes.length}
              onSelect={selectNode}
            />
          ) : (
            <>
              <p className={`${heading} mt-4 text-alt`}>
                {branch.parentId ? t('alt.whatIfIn', { year: formatYear(branch.event.year) }) : t('alt.whatIf')}
              </p>
              <h2 className="mt-1 font-display text-3xl leading-tight font-medium">{branch.alteration.title}</h2>

              {branch.status === 'streaming' && (
                <div className="mt-4" aria-live="polite">
                  <p className="text-sm text-parchment/70">
                    {nodes.length
                      ? nodes.length === 1
                        ? t('alt.streamingNode')
                        : t('alt.streamingNodes', { count: nodes.length })
                      : content?.divergencePoint
                        ? t('alt.streamingLinks')
                        : t('alt.streamingStart')}
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

              {branch.status === 'error' && (
                <div className="mt-4" role="alert">
                  <p className="text-sm text-rupture">{branch.message}</p>
                  <button
                    type="button"
                    onClick={() => void loadBranch(branch.id)}
                    className="mt-3 rounded-full bg-alt/90 px-5 py-2 font-mono text-xs tracking-[0.2em] text-void uppercase hover:bg-alt focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-alt"
                  >
                    {t('common.retry')}
                  </button>
                </div>
              )}

              {data && <ImpactCard data={data} />}

              {data && (
                <div className="mt-4 flex flex-wrap items-start gap-2">
                  <button
                    type="button"
                    onClick={() => setComparing(true)}
                    className="rounded-full bg-real/90 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-void uppercase transition-colors hover:bg-real focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-real"
                  >
                    {t('alt.compare')}
                  </button>
                  <ShareButton />
                </div>
              )}

              {content?.divergencePoint && (
                <section className="mt-5">
                  <h3 className={`${heading} text-rupture`}>
                    {t('alt.divergence', { year: formatYear(content.divergencePoint.year) })}
                  </h3>
                  <p className="mt-1.5 text-sm font-medium">{content.divergencePoint.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-parchment/75">{content.divergencePoint.description}</p>
                </section>
              )}

              {content?.butterflyEffects && (
                <section className="mt-5">
                  <h3 className={`${heading} text-dust`}>{t('alt.butterfly')}</h3>
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
                  <h3 className={`${heading} text-dust`}>{t('alt.milestones')}</h3>
                  <ol className="-mx-2 mt-2">
                    {nodes.map((n, i) => {
                      const forks = children.filter((c) => c.forkNode === i)
                      return (
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
                            {forks.length > 0 && (
                              <span className="shrink-0 font-mono text-[10px] text-branch" title={t('alt.forks')}>
                                ⑂ {forks.length}
                              </span>
                            )}
                          </button>
                        </li>
                      )
                    })}
                  </ol>
                </section>
              )}

              {data && (
                <>
                  <section className="mt-5">
                    <h3 className={`${heading} text-alt`}>{t('alt.world2025')}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-parchment/80">{data.worldIn2025}</p>
                  </section>
                  <section className="mt-5 rounded-lg border border-parchment/10 p-3">
                    <h3 className={`${heading} text-dust`}>{t('alt.plausibility')}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-parchment/70">{data.plausibilityNote}</p>
                  </section>
                </>
              )}

              {children.length > 0 && (
                <section className="mt-5">
                  <h3 className={`${heading} text-branch`}>{t('alt.forks')}</h3>
                  <ul className="-mx-2 mt-2">
                    {children.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => setActiveBranch(c.id)}
                          className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-parchment/5 focus-visible:outline-2 focus-visible:outline-alt"
                        >
                          <span className="font-mono text-[10px] text-dust">
                            {branchLabel(c.id)} · {formatYear(c.event.year)}
                          </span>
                          <span className="block text-sm leading-snug">{c.alteration.title}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <p className="mt-5 text-[11px] leading-relaxed text-dust">
                {t('alt.disclaimer')}
              </p>
              <div className="mt-3 flex flex-wrap gap-x-2">
                <button type="button" onClick={back} className={`${ghostButton} px-0`}>
                  {branch.parentId ? t('alt.parent') : t('alt.otherAlteration')}
                </button>
                <button type="button" onClick={clearSelection} className={ghostButton}>
                  {t('alt.newZone')}
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
  branch,
  node,
  index,
  count,
  onSelect,
}: {
  branch: Branch
  node: TimelineNode
  index: number
  count: number
  onSelect: (i: number | null) => void
}) {
  const branches = useChronos((s) => s.branches)
  const canFork = branch.status === 'ready' && branchDepth(branches, branch) < MAX_DEPTH
  const t = useT()
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
        <h3 className={`${heading} text-real`}>{t('alt.inReality')}</h3>
        <p className="mt-1.5 text-sm leading-relaxed text-parchment/80">{node.realHistoryComparison}</p>
      </section>

      {node.affectedRegions.length > 0 && (
        <section className="mt-4">
          <h3 className={`${heading} text-dust`}>{t('alt.regions')}</h3>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {node.affectedRegions.map((r) => (
              <li key={r.name} className="rounded-full border border-rupture/40 px-2.5 py-0.5 text-xs text-parchment/85">
                {r.name}
              </li>
            ))}
          </ul>
        </section>
      )}

      {canFork && <ForkForm key={`${branch.id}-${index}`} node={node} index={index} />}

      <div className="mt-5 flex items-center justify-between">
        <button
          type="button"
          disabled={index === 0}
          onClick={() => onSelect(index - 1)}
          className={`${ghostButton} px-0 disabled:opacity-30`}
        >
          {t('alt.prev')}
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
          {t('alt.next')}
        </button>
      </div>
      <button type="button" onClick={() => onSelect(null)} className={`${ghostButton} mt-2 self-start px-0`}>
        {t('alt.overview')} <span className="opacity-50">{t('common.esc')}</span>
      </button>
    </>
  )
}

/** Rewrites a milestone of this alternate timeline, which grows a sub-branch from it. */
function ForkForm({ node, index }: { node: TimelineNode; index: number }) {
  const forkBranch = useChronos((s) => s.forkBranch)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const t = useT()
  const suggestions = [
    t('alt.forkNotHappened', { title: node.title }),
    t('alt.forkFailed', { title: node.title }),
    t('alt.forkEarlier', { title: node.title }),
  ]
  const fork = (title: string) => forkBranch(index, { title: title.slice(0, 300), description: '' })

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 self-start rounded-full border border-branch/40 px-4 py-2 font-mono text-[11px] tracking-[0.2em] text-branch uppercase transition-colors hover:bg-branch/10 focus-visible:outline-2 focus-visible:outline-branch"
      >
        {t('alt.forkButton')}
      </button>
    )
  }
  return (
    <section className="mt-5 rounded-lg border border-branch/30 p-3">
      <h3 className={`${heading} text-branch`}>{t('alt.forkTitle')}</h3>
      <div className="mt-2 flex flex-col gap-1.5">
        {suggestions.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => fork(s)}
            className="rounded-md border border-parchment/10 px-2.5 py-1.5 text-left text-xs transition-colors hover:border-branch/50 focus-visible:outline-2 focus-visible:outline-branch"
          >
            {s}
          </button>
        ))}
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim().length >= 3) fork(text.trim())
        }}
      >
        <label className="sr-only" htmlFor="fork-text">
          {t('alt.forkOwnLabel')}
        </label>
        <input
          id="fork-text"
          value={text}
          maxLength={300}
          onChange={(e) => setText(e.target.value)}
          placeholder={t('alt.forkOwn')}
          className="min-w-0 flex-1 rounded-md border border-parchment/15 bg-transparent px-2.5 py-1.5 text-xs placeholder:text-dust/70 focus:border-branch/60 focus:outline-none"
        />
        <button
          type="submit"
          disabled={text.trim().length < 3}
          className="rounded-md bg-branch/90 px-3 font-mono text-[10px] tracking-[0.15em] text-void uppercase disabled:opacity-40"
        >
          {t('alt.forkCreate')}
        </button>
      </form>
    </section>
  )
}
