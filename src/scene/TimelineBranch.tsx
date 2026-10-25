import { useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import type { AlternatePartial, AlternateResponse } from '../../shared/schemas'
import { hiddenByGlobe } from '../lib/geo'
import { formatYear } from '../lib/time'
import { selectedCountry, useChronos } from '../store/useChronos'
import {
  altPoint,
  branchFrame,
  branchSpan,
  realPoint,
  yearToBranchT,
  type BranchFrame,
} from './branchLayout'
import { branchFragment, branchVertex } from './shaders/branch'

const noRaycast = () => null
/** 3D labels must never swallow clicks meant for the scene. */
const CLICK_THROUGH = { pointerEvents: 'none' as const }
const tmp = new THREE.Vector3()
const camDir = new THREE.Vector3()

class ArcCurve extends THREE.Curve<THREE.Vector3> {
  constructor(
    private frame: BranchFrame,
    private fn: typeof realPoint,
  ) {
    super()
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    return this.fn(this.frame, t, target)
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

/** Gap between nodes that share a year, so they never overlap. */
const MIN_GAP = 0.055
/** Pointer distance, in pixels, within which a milestone counts as hovered. */
const PICK_RADIUS = 18

export function TimelineBranch() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const alternate = useChronos((s) => s.alternate)
  const selectedNode = useChronos((s) => s.selectedNode)
  const fallbackYear = useChronos((s) => {
    const k = s.keyEvents
    return k.status === 'ready' ? (k.data.events.find((e) => e.id === s.selectedEvent)?.year ?? k.data.year) : s.year
  })
  const [hoveredNode, setHoveredNode] = useState<number | null>(null)

  const active = phase === 'alternate'
  const content: AlternateResponse | AlternatePartial | null =
    alternate.status === 'ready' ? alternate.data : alternate.status === 'idle' ? null : alternate.partial
  const nodes = useMemo(() => content?.timeline ?? [], [content])
  const divergenceYear = content?.divergencePoint?.year ?? fallbackYear
  const span = useMemo(() => branchSpan(divergenceYear), [divergenceYear])
  const done = alternate.status === 'ready'

  const frame = useMemo(() => (country ? branchFrame(country) : null), [country])
  const geometry = useMemo(() => {
    if (!frame) return null
    return {
      real: new THREE.TubeGeometry(new ArcCurve(frame, realPoint), 240, 0.006, 6, false),
      alt: new THREE.TubeGeometry(new ArcCurve(frame, altPoint), 240, 0.008, 6, false),
      stem: new THREE.BufferGeometry().setFromPoints([frame.n.clone(), realPoint(frame, 0)]),
    }
  }, [frame])
  useEffect(
    () => () => {
      geometry?.real.dispose()
      geometry?.alt.dispose()
      geometry?.stem.dispose()
    },
    [geometry],
  )

  const realMat = useMemo(() => arcMaterial('#2c6ea6', '#7fd0ff'), [])
  const altMat = useMemo(() => arcMaterial('#e0604a', '#ffcf7a'), [])
  const stemMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#e0604a', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )
  const linkMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#ece6d6', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )

  // node positions along both arcs (t is pushed forward when years collide)
  const placed = useMemo(() => {
    if (!frame) return []
    let prev = -1
    return nodes.map((node) => {
      const t = Math.max(yearToBranchT(node.year, span), prev + MIN_GAP)
      prev = t
      return { node, t, alt: altPoint(frame, Math.min(t, 1)), real: realPoint(frame, Math.min(t, 1)) }
    })
  }, [frame, nodes, span])

  const links = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setFromPoints(placed.flatMap((p) => [p.real, p.alt]))
    return g
  }, [placed])
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
  const placedRef = useRef(placed)
  placedRef.current = placed
  useEffect(() => {
    if (!active) return
    // listen where the 3D layer itself receives pointer events (canvas wrapper)
    const el = eventSource ?? gl.domElement
    const v = new THREE.Vector3()
    let down: [number, number] | null = null
    const pick = (e: MouseEvent) => {
      const rect = gl.domElement.getBoundingClientRect()
      let best = -1
      let bestDist = PICK_RADIUS
      placedRef.current.forEach((p, i) => {
        if (hiddenByGlobe(camera.position, p.alt)) return
        v.copy(p.alt).project(camera)
        const x = ((v.x + 1) / 2) * rect.width + rect.left
        const y = ((1 - v.y) / 2) * rect.height + rect.top
        const d = Math.hypot(x - e.clientX, y - e.clientY)
        if (d < bestDist) {
          best = i
          bestDist = d
        }
      })
      return best
    }
    const onMove = (e: PointerEvent) => {
      const i = pick(e)
      setHoveredNode(i < 0 ? null : i)
      document.body.style.cursor = i < 0 ? '' : 'pointer'
    }
    const onDown = (e: PointerEvent) => (down = [e.clientX, e.clientY])
    const onClick = (e: MouseEvent) => {
      if (down && Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6) return
      const i = pick(e)
      if (i < 0) return
      const { selectedNode, selectNode } = useChronos.getState()
      selectNode(selectedNode === i ? null : i)
    }
    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerdown', onDown)
    el.addEventListener('click', onClick)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerdown', onDown)
      el.removeEventListener('click', onClick)
      setHoveredNode(null)
      document.body.style.cursor = ''
    }
  }, [active, gl, camera, eventSource])

  const group = useRef<THREE.Group>(null)
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const state = useRef({ visible: 0, real: 0, alt: 0 })

  useFrame(({ camera, clock }, dt) => {
    const g = group.current
    if (!g || !frame) return
    const s = state.current
    s.visible = THREE.MathUtils.damp(s.visible, active ? 1 : 0, 3, dt)
    g.visible = s.visible > 0.01
    if (!g.visible) {
      s.real = 0
      s.alt = 0
      return
    }
    // the real line draws first, then the branch grows as milestones arrive
    s.real = Math.min(1, s.real + dt * 0.6)
    const lastT = placed.length ? placed[placed.length - 1].t : 0
    const target = done ? Math.max(lastT, 1) : Math.max(0.04, lastT) + 0.02
    s.alt = THREE.MathUtils.damp(s.alt, s.real > 0.25 ? Math.min(target, 1) : 0, 2, dt)

    for (const m of [realMat, altMat]) {
      m.uniforms.time.value = clock.elapsedTime
      m.uniforms.opacity.value = s.visible
    }
    realMat.uniforms.reveal.value = s.real
    altMat.uniforms.reveal.value = s.alt
    stemMat.opacity = 0.7 * s.visible
    linkMat.opacity = 0.12 * s.visible

    camDir.copy(camera.position).normalize()
    for (const el of labels.current) {
      if (!el) continue
      const t = Number(el.dataset.t)
      const track = el.dataset.track === 'real' ? realMat : altMat
      tmp.set(Number(el.dataset.x), Number(el.dataset.y), Number(el.dataset.z))
      const shown = track.uniforms.reveal.value >= t - 0.02 && !hiddenByGlobe(camera.position, tmp)
      el.style.opacity = String(shown ? s.visible : 0)
    }
  })

  if (!frame || !geometry) return null
  let labelIndex = 0
  const label = (track: 'real' | 'alt', t: number, p: THREE.Vector3) => {
    const i = labelIndex++
    return {
      ref: (el: HTMLDivElement | null) => {
        labels.current[i] = el
      },
      'data-t': t,
      'data-track': track,
      'data-x': p.x,
      'data-y': p.y,
      'data-z': p.z,
      style: { opacity: 0 },
    }
  }
  labels.current.length = placed.length + ticks.length + 3

  const divergencePos = realPoint(frame, 0)
  const realEnd = realPoint(frame, 1)
  const altEnd = altPoint(frame, 1)

  return (
    <group ref={group} visible={false}>
      <mesh geometry={geometry.real} material={realMat} raycast={noRaycast} />
      <mesh geometry={geometry.alt} material={altMat} raycast={noRaycast} />
      <lineSegments geometry={geometry.stem} material={stemMat} raycast={noRaycast} />
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
          <span className="font-mono text-[10px] tracking-[0.2em] text-rupture uppercase">Point de divergence</span>
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

      {placed.map(({ node, t, alt }, i) => {
        const isSelected = selectedNode === i
        const isHover = hoveredNode === i
        return (
          <group key={`${node.year}-${i}`} position={alt}>
            <mesh scale={isSelected ? 1.8 : isHover ? 1.4 : 1} raycast={noRaycast}>
              <sphereGeometry args={[0.024, 20, 16]} />
              <meshBasicMaterial color={isSelected ? '#fff1c9' : '#ffcf7a'} toneMapped={false} />
            </mesh>
            <Html center zIndexRange={[10, 0]} style={CLICK_THROUGH}>
              <div
                {...label('alt', t, alt)}
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
          </group>
        )
      })}

      <Html position={realEnd} center zIndexRange={[5, 0]} style={CLICK_THROUGH}>
        <div
          {...label('real', 1, realEnd)}
          className="pointer-events-none translate-x-14 font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-real uppercase select-none"
        >
          Histoire réelle
        </div>
      </Html>
      <Html position={altEnd} center zIndexRange={[5, 0]} style={CLICK_THROUGH}>
        <div
          {...label('alt', 1, altEnd)}
          className="pointer-events-none -translate-y-9 text-center font-mono text-[10px] tracking-[0.2em] whitespace-nowrap text-alt uppercase select-none"
        >
          Chronologie alternative
          <span className="block text-[9px] tracking-normal text-dust normal-case">spéculative</span>
        </div>
      </Html>
    </group>
  )
}
