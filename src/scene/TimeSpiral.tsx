import { useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { erasFor } from '../data/eras'
import { latLonToVector3 } from '../lib/geo'
import { formatYear, helixAngle, helixPoint, tToYear, yearToT } from '../lib/time'
import { selectedCountry, useChronos } from '../store/useChronos'
import { spiralFragment, spiralVertex } from './shaders/spiral'

const SEGMENTS = 900
const TICK_YEARS = [-3000, -2000, -1000, 1, 500, 1000, 1500, 1800, 1900, 2000]
const ARC_POINTS = 48
const TICK_LABEL_OFFSET = new THREE.Vector3(0, -0.06, 0)

class HelixCurve extends THREE.Curve<THREE.Vector3> {
  constructor() {
    super()
  }

  getPoint(t: number, target = new THREE.Vector3()) {
    return helixPoint(t, target)
  }
}

const noRaycast = () => null
const tmp = new THREE.Vector3()
const camDir = new THREE.Vector3()
const toPoint = new THREE.Vector3()
const mid = new THREE.Vector3()

/** True if the segment camera → point passes through the globe. */
function hiddenByGlobe(camera: THREE.Vector3, point: THREE.Vector3) {
  toPoint.subVectors(point, camera)
  const len = toPoint.length()
  toPoint.divideScalar(len)
  const b = camera.dot(toPoint)
  const c = camera.lengthSq() - 1
  const disc = b * b - c
  if (disc < 0) return false
  const hit = -b - Math.sqrt(disc)
  return hit > 0 && hit < len
}

/** Centuries as small radial ticks, millennia longer. */
function buildTicks() {
  const out: number[] = []
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  for (let year = -3000; year <= 2000; year += 100) {
    const t = yearToT(year === 0 ? 1 : year)
    const len = year % 1000 === 0 ? 0.07 : 0.035
    helixPoint(t, a, 1.5 - len / 2)
    helixPoint(t, b, 1.5 + len / 2)
    out.push(a.x, a.y, a.z, b.x, b.y, b.z)
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(out, 3))
  return g
}

export function TimeSpiral() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const year = useChronos((s) => s.year)
  const setYear = useChronos((s) => s.setYear)
  const eras = useMemo(() => (country ? erasFor(country) : []), [country])
  const [hoveredEra, setHoveredEra] = useState(-1)

  const group = useRef<THREE.Group>(null)
  const cursorRef = useRef<THREE.Group>(null)
  const labels = useRef<(HTMLDivElement | null)[]>([])
  const state = useRef({ reveal: 0, cursorT: yearToT(year), rotation: 0, visible: 0 })

  const curve = useMemo(() => new HelixCurve(), [])
  const tube = useMemo(() => new THREE.TubeGeometry(curve, SEGMENTS, 0.0055, 6, false), [curve])
  const hitTube = useMemo(() => new THREE.TubeGeometry(curve, 400, 0.09, 5, false), [curve])
  const ticks = useMemo(buildTicks, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: spiralVertex,
        fragmentShader: spiralFragment,
        uniforms: { reveal: { value: 0 }, cursor: { value: 0 }, time: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    [],
  )
  const ticksMat = useMemo(
    () => new THREE.LineBasicMaterial({ color: '#7fb8e6', transparent: true, opacity: 0, depthWrite: false }),
    [],
  )
  const hitMat = useMemo(() => new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), [])

  // arc linking the country on the globe to the cursor on the spiral
  const arc = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(ARC_POINTS * 3), 3))
    const m = new THREE.LineBasicMaterial({ color: '#ffcf7a', transparent: true, opacity: 0, depthWrite: false })
    return new THREE.Line(g, m)
  }, [])
  const arcStart = useMemo(
    () => (country ? latLonToVector3(country.center[0], country.center[1], 1.004) : new THREE.Vector3()),
    [country],
  )

  const active = phase === 'era'

  useFrame(({ camera }, dt) => {
    const s = state.current
    const g = group.current
    if (!g) return
    s.visible = THREE.MathUtils.damp(s.visible, active ? 1 : 0, 4, dt)
    s.reveal = active ? Math.min(1.05, s.reveal + dt * 0.55) : THREE.MathUtils.damp(s.reveal, 0, 5, dt)
    g.visible = s.visible > 0.01
    arc.visible = g.visible
    if (!g.visible) return

    s.cursorT = THREE.MathUtils.damp(s.cursorT, yearToT(useChronos.getState().year), 6, dt)

    // turn the spiral so the cursor always faces the camera
    const camAngle = Math.atan2(-camera.position.z, camera.position.x)
    let target = camAngle - helixAngle(s.cursorT)
    target += Math.round((s.rotation - target) / (Math.PI * 2)) * Math.PI * 2
    s.rotation = THREE.MathUtils.damp(s.rotation, target, 3, dt)
    g.rotation.y = s.rotation

    material.uniforms.reveal.value = s.reveal
    material.uniforms.cursor.value = s.cursorT
    material.uniforms.time.value += dt
    ticksMat.opacity = 0.45 * s.visible * Math.min(1, s.reveal)

    const cursorVisible = s.reveal > s.cursorT
    if (cursorRef.current) {
      helixPoint(s.cursorT, cursorRef.current.position)
      cursorRef.current.visible = cursorVisible
      cursorRef.current.scale.setScalar(1 + Math.sin(material.uniforms.time.value * 3) * 0.12)
    }

    // arc: quadratic bezier from the country to the cursor (world space)
    const end = cursorRef.current ? cursorRef.current.getWorldPosition(tmp) : tmp.set(0, 0, 0)
    mid.addVectors(arcStart, end).multiplyScalar(0.5)
    mid.setLength(Math.max(mid.length(), 1) + 0.35)
    const pos = arc.geometry.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < ARC_POINTS; i++) {
      const u = i / (ARC_POINTS - 1)
      const a = (1 - u) * (1 - u)
      const b = 2 * (1 - u) * u
      const c = u * u
      pos.setXYZ(
        i,
        a * arcStart.x + b * mid.x + c * end.x,
        a * arcStart.y + b * mid.y + c * end.y,
        a * arcStart.z + b * mid.z + c * end.z,
      )
    }
    pos.needsUpdate = true
    arc.visible = g.visible
    ;(arc.material as THREE.LineBasicMaterial).opacity = cursorVisible ? 0.55 * s.visible : 0

    // labels fade when they face away or sit behind the globe
    camDir.copy(camera.position).normalize()
    for (const el of labels.current) {
      if (!el) continue
      const t = Number(el.dataset.t)
      helixPoint(t, tmp).applyMatrix4(g.matrixWorld)
      const shown = s.reveal > t && !hiddenByGlobe(camera.position, tmp)
      const facing = tmp.normalize().dot(camDir)
      el.style.opacity = String(shown ? THREE.MathUtils.clamp(0.25 + facing, 0.15, 1) * s.visible : 0)
    }
  })

  const label = (i: number) => (el: HTMLDivElement | null) => {
    labels.current[i] = el
  }

  return (
    <>
      <group ref={group} visible={false}>
        <mesh geometry={tube} material={material} raycast={noRaycast} />
        <lineSegments geometry={ticks} material={ticksMat} raycast={noRaycast} />
        <mesh
          geometry={hitTube}
          material={hitMat}
          onClick={(e) => {
            if (!active || !e.uv || e.delta > 6) return
            e.stopPropagation()
            setYear(tToYear(e.uv.x))
          }}
          onPointerOver={() => active && (document.body.style.cursor = 'pointer')}
          onPointerOut={() => (document.body.style.cursor = '')}
        />

        {eras.map((era, i) => {
          const t = yearToT(era.focus)
          const p = helixPoint(t)
          const current = year >= era.start && year <= era.end
          const hover = hoveredEra === i
          return (
            <group key={era.label} position={p}>
              <mesh
                scale={hover || current ? 1.6 : 1}
                onClick={(e) => {
                  if (!active) return
                  e.stopPropagation()
                  setYear(era.focus)
                }}
                onPointerOver={(e) => {
                  if (!active) return
                  e.stopPropagation()
                  setHoveredEra(i)
                  document.body.style.cursor = 'pointer'
                }}
                onPointerOut={() => {
                  setHoveredEra(-1)
                  document.body.style.cursor = ''
                }}
              >
                <sphereGeometry args={[0.022, 16, 12]} />
                <meshBasicMaterial color={current ? '#ffcf7a' : '#dfe9f5'} toneMapped={false} />
              </mesh>
              <Html position={[0, 0.07, 0]} center zIndexRange={[10, 0]}>
                <div
                  ref={label(i)}
                  data-t={t}
                  className={`pointer-events-none whitespace-nowrap font-sans text-[11px] transition-colors select-none ${
                    current ? 'text-alt' : hover ? 'text-parchment' : 'text-parchment/70'
                  }`}
                  style={{ opacity: 0 }}
                >
                  {era.label}
                </div>
              </Html>
            </group>
          )
        })}

        {TICK_YEARS.map((y, j) => {
          const t = yearToT(y)
          return (
            <Html key={y} position={helixPoint(t).add(TICK_LABEL_OFFSET)} center zIndexRange={[5, 0]}>
              <div
                ref={label(eras.length + j)}
                data-t={t}
                className="pointer-events-none font-mono text-[9px] tracking-wider whitespace-nowrap text-real/70 select-none"
                style={{ opacity: 0 }}
              >
                {formatYear(y)}
              </div>
            </Html>
          )
        })}

        <group ref={cursorRef}>
          <mesh raycast={noRaycast}>
            <sphereGeometry args={[0.03, 20, 16]} />
            <meshBasicMaterial color="#ffd38a" toneMapped={false} />
          </mesh>
          <mesh raycast={noRaycast}>
            <sphereGeometry args={[0.06, 20, 16]} />
            <meshBasicMaterial color="#ffb347" transparent opacity={0.18} depthWrite={false} toneMapped={false} />
          </mesh>
        </group>
      </group>
      <primitive object={arc} raycast={noRaycast} />
    </>
  )
}
