import { AnimatePresence, motion } from 'framer-motion'
import type { TimelineNode } from '../../shared/schemas'
import { formatYear } from '../lib/time'
import { activeBranchOf, branchLabel, branchPath, useChronos, type Branch } from '../store/useChronos'
import { useT } from '../i18n'

interface Row {
  node: TimelineNode
  branch: Branch
}

/** Milestones from the root down to the active branch, each ancestor cut at its fork. */
function rowsFor(branches: Branch[], branch: Branch): Row[] {
  const path = branchPath(branches, branch)
  return path.flatMap((b, i) => {
    const timeline = b.data?.timeline ?? []
    const next = path[i + 1]
    const upTo = next?.forkNode ?? timeline.length - 1
    return timeline.slice(0, upTo + 1).map((node) => ({ node, branch: b }))
  })
}

const cell = 'rounded-lg p-3 text-sm leading-relaxed'

/** Reality and the alternate timeline side by side, milestone by milestone. */
export function ComparisonView() {
  const comparing = useChronos((s) => s.comparing)
  const branches = useChronos((s) => s.branches)
  const branch = useChronos(activeBranchOf)
  const setComparing = useChronos((s) => s.setComparing)
  const selectNode = useChronos((s) => s.selectNode)
  const setActiveBranch = useChronos((s) => s.setActiveBranch)
  const t = useT()

  const root = branches[0]
  const data = branch?.data
  const open = comparing && !!branch && !!data && !!root

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="compare"
          className="pointer-events-auto absolute inset-0 z-30 flex items-start justify-center overflow-y-auto bg-void/70 p-4 backdrop-blur-sm sm:p-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={(e) => e.target === e.currentTarget && setComparing(false)}
          role="dialog"
          aria-modal="true"
          aria-label={t('compare.dialog')}
        >
          <motion.div
            className="glass w-full max-w-5xl rounded-2xl p-5 sm:p-8"
            initial={{ y: 24 }}
            animate={{ y: 0 }}
            exit={{ y: 24 }}
            transition={{ duration: 0.4, ease: [0.2, 0.7, 0.2, 1] }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.3em] text-rupture uppercase">{t('compare.kicker')}</p>
                <h2 className="mt-2 font-display text-3xl leading-tight font-medium sm:text-4xl">
                  {branch.alteration.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setComparing(false)}
                className="shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] tracking-[0.2em] text-dust uppercase hover:text-parchment focus-visible:outline-2 focus-visible:outline-real"
              >
                {t('common.close')} <span className="opacity-50">{t('common.esc')}</span>
              </button>
            </div>

            {/* column headers, desktop only (mobile labels each cell) */}
            <div className="mt-6 hidden grid-cols-[5rem_1fr_1fr] gap-3 sm:grid">
              <span />
              <p className="font-mono text-[10px] tracking-[0.3em] text-real uppercase">{t('alt.inReality')}</p>
              <p className="font-mono text-[10px] tracking-[0.3em] text-alt uppercase">
                {t('compare.thisTimeline', { branch: branchLabel(branch.id) })}
              </p>
            </div>

            <ol className="mt-3 flex flex-col gap-3">
              <li className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr_1fr] sm:gap-3">
                <span className="font-mono text-sm text-rupture tabular-nums">{formatYear(root.event.year)}</span>
                <div className={`${cell} border border-real/25 bg-real/5`}>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-real uppercase sm:hidden">{t('alt.inReality')}</p>
                  <p className="font-medium">{root.event.title}</p>
                  <p className="mt-1 text-parchment/75">{root.event.summary}</p>
                </div>
                <div className={`${cell} border border-rupture/40 bg-rupture/5`}>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-rupture uppercase">{t('scene.divergence')}</p>
                  <p className="mt-1 font-medium">{root.alteration.title}</p>
                  {root.data && <p className="mt-1 text-parchment/75">{root.data.divergencePoint.description}</p>}
                </div>
              </li>

              {rowsFor(branches, branch).map(({ node, branch: from }, i) => {
                const forkHere = branches.find((b) => b.parentId === from.id && b.forkNode !== null && from.data?.timeline[b.forkNode] === node)
                return (
                  <li key={`${from.id}-${i}`} className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr_1fr] sm:gap-3">
                    <div className="flex items-baseline gap-2 sm:flex-col sm:gap-1">
                      <span className="font-mono text-sm text-alt tabular-nums">{formatYear(node.year)}</span>
                      {from.id !== branch.id && (
                        <span className="font-mono text-[9px] text-dust">{branchLabel(from.id)}</span>
                      )}
                    </div>
                    <div className={`${cell} border border-real/20`}>
                      <p className="font-mono text-[10px] tracking-[0.2em] text-real uppercase sm:hidden">{t('alt.inReality')}</p>
                      <p className="text-parchment/80">{node.realHistoryComparison}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveBranch(from.id)
                        selectNode(from.data?.timeline.indexOf(node) ?? null)
                        setComparing(false)
                      }}
                      className={`${cell} border border-alt/25 text-left transition-colors hover:border-alt/60 focus-visible:outline-2 focus-visible:outline-alt`}
                    >
                      <span className="flex items-baseline justify-between gap-3">
                        <span className="font-medium">{node.title}</span>
                        <span className="shrink-0 font-mono text-[10px] text-dust tabular-nums">
                          {Math.round(node.confidence * 100)} %
                        </span>
                      </span>
                      <span className="mt-1 block text-parchment/75">{node.description}</span>
                      {forkHere && (
                        <span className="mt-2 block font-mono text-[10px] text-branch">
                          {t('compare.forkHere', { branch: branchLabel(forkHere.id) })}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}

              <li className="grid grid-cols-1 gap-2 sm:grid-cols-[5rem_1fr_1fr] sm:gap-3">
                <span className="font-mono text-sm text-parchment tabular-nums">2025</span>
                <div className={`${cell} border border-real/20`}>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-real uppercase sm:hidden">{t('alt.inReality')}</p>
                  <p className="text-parchment/80">{t('compare.realWorld')}</p>
                </div>
                <div className={`${cell} border border-alt/40 bg-alt/5`}>
                  <p className="font-mono text-[10px] tracking-[0.2em] text-alt uppercase">{t('alt.world2025')}</p>
                  <p className="mt-1 text-parchment/85">{data.worldIn2025}</p>
                </div>
              </li>
            </ol>

            <p className="mt-6 text-xs leading-relaxed text-dust">
              <span className="text-parchment/70">{t('compare.plausibility')}</span>
              {data.plausibilityNote}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
