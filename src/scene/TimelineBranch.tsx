import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { TimelineNode } from '../../shared/schemas'
import { hiddenByGlobe } from '../lib/geo'
import { useT } from '../i18n'
import { formatYear } from '../lib/time'
import { branchContent, branchLabel, selectedCountry, useChronos, type Branch } from '../store/useChronos'
import {
  ROOT_SPLIT,
  arcPoint,
  branchFrame,
  branchSpan,
  realPoint,
  subSplit,
  yearToBranchT,
  type BranchFrame,
  type Split,
} from './branchLayout'
import { branchFragment, branchVertex } from './shaders/branch'

const noRaycast = () => null
/** 3D labels must never swallow clicks meant for the scene. */
const CLICK_THROUGH = { pointerEvents: 'none' as const }
const tmp = new THREE.Vector3()

/** Gap between nodes that share a year, so they never overlap. */
const MIN_GAP = 0.055
/** Pointer distance, in pixels, within which a milestone counts as hovered. */
const PICK_RADIUS = 18

/** Arc from t = from to t = 1, parameterised 0 → 1 so the reveal shader works per branch. */
class ArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private frame: BranchFrame,
    private splits: Split[],
    private from = 0,
  ) {
    super()
  }
  getPoint(u: number, target = new THREE.Vector3()) {
    return arcPoint(this.frame, this.splits, this.from + u * (1 - this.from), target)
  }
}

function arcMaterial(colorA: string, colorB: string) {
  return new THREE.ShaderMaterial({
    vertexShader: branchVertex,
    fragmentShader: branchFragment,
    uniforms: {
      colorA: { value: new THREE.Color(colorA) },
      colorB: { value: new THREE.Color(colorB) },
      reveal: { value: 0 },
      time: { value: 0 },
      opacity: { value: 0 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
}

interface PlacedNode {
  node: TimelineNode
  /** Global time position and the same position local to the branch (for the reveal). */
  t: number
  u: number
  pos: THREE.Vector3
  real: THREE.Vector3
}

interface LaidOutBranch {
  branch: Branch
  splits: Split[]
  from: number
  nodes: PlacedNode[]
  done: boolean
}

/** Places every branch: parents first, each child starting at its fork milestone. */
function layOut(frame: BranchFrame, branches: Branch[], span: [number, number]) {
  const out = new Map<string, LaidOutBranch>()
  for (const branch of branches) {
    const parent = branch.parentId ? out.get(branch.parentId) : undefined
    if (branch.parentId && !parent) continue
    const fork = parent && branch.forkNode !== null ? parent.nodes[branch.forkNode] : undefined
    if (parent && !fork) continue
    const from = fork ? fork.t : 0
    const sibling = parent ? branches.filter((b) => b.parentId === parent.branch.id).indexOf(branch) : 0
    const splits = parent ? [...parent.splits, subSplit(from, sibling)] : [ROOT_SPLIT]

    let prev = from - MIN_GAP
    if (fork) prev = from // the first child milestone sits just after the fork
    const nodes = (branchContent(branch)?.timeline ?? []).map((node) => {
      const t = Math.min(1, Math.max(yearToBranchT(node.year, span), prev + MIN_GAP))
      prev = t
      return {
        node,
        t,
        u: (t - from) / (1 - from || 1),
        pos: arcPoint(frame, splits, t),
        real: realPoint(frame, t),
      }
    })
    out.set(branch.id, { branch, splits, from, nodes, done: branch.status === 'ready' })
  }
  return [...out.values()]
}

const ROOT_COLORS: [string, string] = ['#e0604a', '#ffcf7a']
const SUB_COLORS: [string, string] = ['#b072e8', '#ffd9a0']

export function TimelineBranch() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const branches = useChronos((s) => s.branches)
  const activeBranch = useChronos((s) => s.activeBranch)
  const selectedNode = useChronos((s) => s.selectedNode)
  const [hovered, setHovered] = useState<{ branch: string; index: number } | null>(null)
  const t = useT()

  const active = phase === 'alternate'
  const root = branches[0]
  const divergenceYear = (root && branchContent(root)?.divergencePoint?.year) ?? root?.event.year ?? 0
  const span = useMemo(() => branchSpan(divergenceYear), [divergenceYear])
  const frame = useMemo(() => (country ? branchFrame(country) : null), [country])
  const laid = useMemo(() => (frame ? layOut(frame, branches, span) : []), [frame, branches, span])

  // geometry and material per branch, rebuilt only when the tree shape changes
  const shapeKey = laid.map((b) => `${b.branch.id}@${b.from.toFixed(3)}`).join('|')
  const arcs = useMemo(() => {
    if (!frame) return new Map<string, { geometry: THREE.TubeGeometry; material: THREE.ShaderMaterial }>()
    return new Map(
      laid.map((b) => {
        const [a, c] = b.branch.parentId ? SUB_COLORS : ROOT_COLORS
        return [
          b.branch.id,
          {
            geometry: new THREE.TubeGeometry(new ArcCurve(frame, b.splits, b.from), 240, 0.008, 6, false),
            material: arcMaterial(a, c),
          },
        ]
      }),
    )
  }, [frame, shapeKey])
  useEffect(
    () => () =>
      arcs.forEach((a) => {
        a.geometry.dispose()
        a.material.dispose()
      }),
    [arcs],
  )

  const base = useMemo(() => {
    if (!frame) return null
    return {
      real: new THREE.TubeGeometry(new ArcCurve(frame, []), 240, 0.006, 6, false),
      stem: new THREE.BufferGeometry().setFromPoints([frame.n.clone(), realPoint(frame, 0)]),
    }
  }, [frame])
  useEffect(
    () => () => {
      base?.real.dispose()
      base?.stem.dispose()
    },
    [base],
  )
  const realMat = useMemo(() => arcMaterial('#2c6ea6', '#7fd0ff'), [])
  const stemMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#e0604a', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )
  const linkMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ece6d6', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )

  // faint links between the active branch and reality at the same moments
  const current = laid.find((b) => b.branch.id === activeBranch)
  const links = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setFromPoints((current?.nodes ?? []).flatMap((p) => [p.real, p.pos]))
    return g
  }, [current])
  useEffect(() => () => links.dispose(), [links])

  const ticks = useMemo(() => {
    // log scale: ticks a few years apart near the divergence, decades apart later
    const [y0, y1] = span
    const years = [5, 10, 25, 50, 75, 100].map((d) => Math.round((y0 + d) / 5) * 5).filter((y) => y > y0 + 2 && y <= y1)
    return [...new Set(years)]
  }, [span])

  // Milestones are picked in screen space (nearest one under the pointer) rather than
  // through mesh events: it gives small nodes a generous target, and nodes that mount
  // while the stream is running are not always registered for 3D pointer events.
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const eventSource = useThree((s) => s.events.connected) as HTMLElement | undefined
  const laidRef = useRef(laid)
  laidRef.current = laid
  useEffect(() => {
    if (!active) return
    // listen where the 3D layer itself receives pointer events (canvas wrapper)
    const el = eventSource ?? gl.domElement
    const v = new THREE.Vector3()
    let down: [number, number] | null = null
    const pick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      let best: { branch: string; index: number } | null = null
      let bestDist = PICK_RADIUS
      for (const b of laidRef.current) {
        b.nodes.forEach((p, i) => {
          if (hiddenByGlobe(camera.position, p.pos)) return
          v.copy(p.pos).project(camera)
          const x = ((v.x + 1) / 2) * rect.width + rect.left
          const y = ((1 - v.y) / 2) * rect.height + rect.top
          const d = Math.hypot(x - e.clientX, y - e.clientY)
          if (d < bestDist) {
            best = { branch: b.branch.id, index: i }
            bestDist = d
          }
        })
      }
      return best as { branch: string; index: number } | null
    }
    const onMove = (e: PointerEvent) => {
      const hit = pick(e)
      setHovered((h) => (h?.branch === hit?.branch && h?.index === hit?.index ? h : hit))
      document.body.style.cursor = hit ? 'pointer' : ''
    }
    const onDown = (e: PointerEvent) => (down = [e.clientX, e.clientY])
    const onClick = (e: MouseEvent) => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const hit = pick(e)
      if (!hit) return
      const s = useChronos.getState()
      if (hit.branch !== s.activeBranch) {
        s.setActiveBranch(hit.branch)
        s.selectNode(hit.index)
      } else s.selectNode(s.selectedNode === hit.index ? null : hit.index)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('click', onClick)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('click', onClick)
      setHovered(null)
      document.body.style.cursor = ''
    }
  }, [active, gl, camera, eventSource])

  const group = useRef<THREE.Group>(null)
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const anim = useRef({ visible: 0, real: 0, reveal: new Map<string, number>(), weight: new Map<string, number>() })

  useFrame(({ camera, clock }, dt) => {
    const g = group.current
    if (!g || !frame) return
    const s = anim.current
    s.visible = THREE.MathUtils.damp(s.visible, active ? 1 : 0, 3, dt)
    g.visible = s.visible > 0.01
    if (!g.visible) {
      s.real = 0
      s.reveal.clear()
      return
    }
    // the real line draws first, then each branch grows as its milestones arrive
    s.real = Math.min(1, s.real + dt * 0.6)
    realMat.uniforms.reveal.value = s.real
    realMat.uniforms.time.value = clock.elapsedTime
    realMat.uniforms.opacity.value = s.visible

    for (const b of laidRef.current) {
      const arc = arcs.get(b.branch.id)
      if (!arc) continue
      const lastU = b.nodes.length ? b.nodes[b.nodes.length - 1].u : 0
      const target = b.done ? 1 : Math.min(1, Math.max(0.04, lastU) + 0.02)
      const ready = !b.branch.parentId ? s.real > 0.25 : true
      const r = THREE.MathUtils.damp(s.reveal.get(b.branch.id) ?? 0, ready ? target : 0, 2, dt)
      s.reveal.set(b.branch.id, r)
      // the active branch is bright, the others step back
      const w = THREE.MathUtils.damp(
        s.weight.get(b.branch.id) ?? 1,
        b.branch.id === useChronos.getState().activeBranch ? 1 : 0.35,
        4,
        dt,
      )
      s.weight.set(b.branch.id, w)
      arc.material.uniforms.reveal.value = r
      arc.material.uniforms.time.value = clock.elapsedTime
      arc.material.uniforms.opacity.value = s.visible * w
    }
    stemMat.opacity = 0.7 * s.visible
    linkMat.opacity = 0.12 * s.visible

    for (const el of labels.current) {
      if (!el) continue
      const track = el.dataset.track!
      const reveal = track === 'real' ? s.real : (s.reveal.get(track) ?? 0)
      tmp.set(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z))
      const shown = reveal >= Number(el.dataset.u) - 0.02 && !hiddenByGlobe(camera.position, tmp)
      const weight = track === 'real' ? 1 : (s.weight.get(track) ?? 1)
      el.style.opacity = String(shown ? s.visible * weight : 0)
    }
  })

  if (!frame || !base) return null
  let labelIndex = 0
  const label = (track: string, u: number, p: THREE.Vector3) => {
    const i = labelIndex++
    return {
      ref: (el: HTMLDivElement | null) => {
        labels.current[i] = el
      },
      'data-u': u,
      'data-track': track,
      'data-x': p.x,
      'data-y': p.y,
      'data-z': p.z,
      style: { opacity: 0 },
    }
  }

  const divergencePos = realPoint(frame, 0)
  const realEnd = realPoint(frame, 1)

  const tree = (
    <group ref={group} visible={false}>
      <mesh geometry={base.real} material={realMat} raycast={noRaycast} />
      <lineSegments geometry={base.stem} material={stemMat} raycast={noRaycast} />
      <lineSegments geometry={links} material={linkMat} raycast={noRaycast} />

      {/* point of divergence */}
      <mesh position={divergencePos} raycast={noRaycast}>
        <sphereGeometry args={[0.03, 20, 16]} />
        <meshBasicMaterial color="#ff8a6a" toneMapped={false} />
      </mesh>
      <Html position={divergencePos} center zIndexRange={[10, 0]} style={CLICK_THROUGH}>
        <div
          {...label('real', 0, divergencePos)}
          className="pointer-events-none translate-y-6 -translate-x-10 text-center whitespace-nowrap select-none"
        >
          <span className="font-mono text-[10px] tracking-[0.2em] text-rupture uppercase">{t('scene.divergence')}</span>
        </div>
      </Html>

      {ticks.map((year) => {
        const t = yearToBranchT(year, span)
        const p = realPoint(frame, t)
        return (
          <Html key={year} position={p} center zIndexRange={[5, 0]} style={CLICK_THROUGH}>
            <div
              {...label('real', t, p)}
              className="pointer-events-none translate-y-4 font-mono text-[9px] whitespace-nowrap text-real/70 select-none"
            >
              {formatYear(year)}
            </div>
          </Html>
        )
      })}
      <Html position={realEnd} center zIndexRange={[5, 0]} style={CLICK_THROUGH}>
        <div
          {...label('real', 1, realEnd)}
          className="pointer-events-none translate-x-14 font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-real uppercase select-none"
        >
          {t('scene.real')}
        </div>
      </Html>

      {laid.map((b) => {
        const arc = arcs.get(b.branch.id)
        const isActive = b.branch.id === activeBranch
        const end = arcPoint(frame, b.splits, 1)
        return (
          <group key={b.branch.id}>
            {arc && <mesh geometry={arc.geometry} material={arc.material} raycast={noRaycast} />}
            {b.nodes.map(({ node, u, pos }, i) => {
              const isSelected = isActive && selectedNode === i
              const isHover = hovered?.branch === b.branch.id && hovered.index === i
              return (
                <group key={`${node.year}-${i}`} position={pos}>
                  <mesh scale={isSelected ? 1.8 : isHover ? 1.4 : isActive ? 1 : 0.7} raycast={noRaycast}>
                    <sphereGeometry args={[0.024, 20, 16]} />
                    <meshBasicMaterial
                      color={isSelected ? '#fff1c9' : b.branch.parentId ? '#e2c4ff' : '#ffcf7a'}
                      toneMapped={false}
                    />
                  </mesh>
                  {(isActive || isHover) && (
                    <Html center zIndexRange={[10, 0]} style={CLICK_THROUGH}>
                      <div
                        {...label(b.branch.id, u, pos)}
                        className="pointer-events-none flex -translate-y-8 flex-col items-center whitespace-nowrap select-none"
                      >
                        <span className={`font-mono text-[10px] ${isSelected ? 'text-parchment' : 'text-alt'}`}>
                          {formatYear(node.year)}
                        </span>
                        {(isSelected || isHover) && (
                          <span className="glass mt-1 max-w-56 truncate rounded px-2 py-0.5 font-sans text-[11px] text-parchment">
                            {node.title}
                          </span>
                        )}
                      </div>
                    </Html>
                  )}
                </group>
              )
            })}
            <Html position={end} center zIndexRange={[5, 0]} style={CLICK_THROUGH}>
              <div
                {...label(b.branch.id, 1, end)}
                className={`pointer-events-none text-center font-mono text-[10px] tracking-[0.2em] whitespace-nowrap uppercase select-none ${
                  b.branch.parentId ? 'translate-x-16 text-branch' : '-translate-y-9 text-alt'
                }`}
              >
                {b.branch.parentId ? branchLabel(b.branch.id) : t('scene.alternate')}
                {!b.branch.parentId && (
                  <span className="block text-[9px] tracking-normal text-dust normal-case">{t('scene.speculative')}</span>
                )}
              </div>
            </Html>
          </group>
        )
      })}
    </group>
  )
  labels.current.length = labelIndex
  return tree
}
