import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import type { KeyEvent } from '../../shared/schemas'
import { latLonToVector3 } from '../lib/geo'
import { selectedCountry, useChronos } from '../store/useChronos'
import { CARD_ASPECT, drawEventCard, drawPlaceholderCard, makeCardTexture } from './cardTexture'
import { eventsDistance } from './framing'
import { monolithFragment, monolithVertex } from './shaders/monolith'

const COUNT = 5
const SPACING = 1.16
const noRaycast = () => null
const toCamera = new THREE.Vector3()
const bottom = new THREE.Vector3()
const ground = new THREE.Vector3()
const matrix = new THREE.Matrix4()
const tmpColor = new THREE.Color()

const FONTS = ['600 52px "Cormorant Garamond"', '400 25px Manrope', '500 24px "IBM Plex Mono"']

interface Layout {
  positions: THREE.Vector3[]
  north: THREE.Vector3
  cardW: number
  cardH: number
  markerSize: number
}

export function Monoliths() {
  const phase = useChronos((s) => s.phase)
  const country = useChronos(selectedCountry)
  const keyEvents = useChronos((s) => s.keyEvents)
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera
  const size = useThree((s) => s.size)

  const active = phase === 'events'
  const events: (KeyEvent | null)[] =
    keyEvents.status === 'ready'
      ? keyEvents.data.events
      : keyEvents.status === 'loading'
        ? Array<null>(COUNT).fill(null)
        : []
  const contentKey = keyEvents.status === 'ready' ? keyEvents.key : keyEvents.status

  const cards = useMemo(
    () =>
      Array.from({ length: COUNT }, () => {
        const { canvas, texture } = makeCardTexture()
        const material = new THREE.ShaderMaterial({
          vertexShader: monolithVertex,
          fragmentShader: monolithFragment,
          uniforms: {
            map: { value: texture },
            appear: { value: 0 },
            hover: { value: 0 },
            dim: { value: 0 },
            selected: { value: 0 },
            loading: { value: 0 },
            time: { value: 0 },
          },
          transparent: true,
          depthWrite: false,
          toneMapped: false,
        })
        return { canvas, texture, material }
      }),
    [],
  )
  useEffect(
    () => () =>
      cards.forEach((c) => {
        c.texture.dispose()
        c.material.dispose()
      }),
    [cards],
  )

  // (re)draw the card faces, again once the web fonts are ready
  useEffect(() => {
    const draw = () => {
      events.forEach((event, i) => {
        if (event) drawEventCard(cards[i].canvas, event, i)
        else drawPlaceholderCard(cards[i].canvas)
        cards[i].texture.needsUpdate = true
      })
    }
    draw()
    let alive = true
    Promise.all(FONTS.map((f) => document.fonts.load(f)))
      .catch(() => undefined)
      .then(() => alive && draw())
    return () => {
      alive = false
    }
  }, [contentKey, cards])

  // cards float in a row above the country, sized to fit the view
  const layout = useMemo<Layout | null>(() => {
    if (!country) return null
    const n = latLonToVector3(country.center[0], country.center[1], 1)
    const east = new THREE.Vector3(0, 1, 0).cross(n)
    if (east.lengthSq() < 1e-6) east.set(1, 0, 0)
    east.normalize()
    const north = n.clone().cross(east)

    const altitude = eventsDistance(country) - 1
    const lift = altitude * 0.42
    const viewH = 2 * (altitude - lift) * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
    const aspect = size.width / size.height
    const cols = aspect >= 1.1 ? 5 : 3
    const rows = Math.ceil(COUNT / cols)
    const wide = size.width >= 640
    let cardH = viewH * (cols === 5 ? 0.46 : 0.3)
    // fit both ways: beside the panel on desktop, above it on mobile
    const availableW = viewH * aspect * (wide ? 0.66 : 0.94)
    const availableH = viewH * (wide ? 0.8 : 0.4)
    cardH *= Math.min(1, availableW / (cols * cardH * CARD_ASPECT * SPACING), availableH / (rows * cardH * 1.1))
    const cardW = cardH * CARD_ASPECT

    const center = n.clone().multiplyScalar(1 + lift)
    const positions = Array.from({ length: COUNT }, (_, i) => {
      const row = Math.floor(i / cols)
      const inRow = Math.min(cols, COUNT - row * cols)
      const x = (i - row * cols - (inRow - 1) / 2) * cardW * SPACING
      const y = ((rows - 1) / 2 - row) * cardH * 1.1
      // gentle arc: outer cards sit slightly further back
      const back = (x / (cols * cardW)) ** 2 * cardW * 0.9
      return center.clone().addScaledVector(east, x).addScaledVector(north, y).addScaledVector(n, -back)
    })
    return { positions, north, cardW, cardH, markerSize: altitude * 0.005 }
  }, [country, camera.fov, size])

  const group = useRef<THREE.Group>(null)
  const meshes = useRef<(THREE.Mesh | null)[]>([])
  const anim = useRef(Array.from({ length: COUNT }, () => ({ appear: 0, hover: 0, delay: 0 })))
  const lastKey = useRef('')

  const beams = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(COUNT * 6), 3))
    const m = new THREE.LineBasicMaterial({
      color: '#7fd0ff',
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    })
    return new THREE.LineSegments(g, m)
  }, [])
  const markers = useMemo(() => {
    const m = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 12, 8),
      new THREE.MeshBasicMaterial({ toneMapped: false }),
      COUNT,
    )
    m.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(COUNT * 3), 3)
    return m
  }, [])

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g || !layout) return
    const { hoveredEvent, selectedEvent } = useChronos.getState()
    const visible = active && events.length > 0

    if (lastKey.current !== contentKey) {
      lastKey.current = contentKey
      anim.current.forEach((a, i) => {
        a.appear = 0
        a.delay = 0.35 + i * 0.14
      })
    }

    let anyVisible = false
    const focus = hoveredEvent ?? selectedEvent
    const pos = beams.geometry.attributes.position as THREE.BufferAttribute
    events.forEach((event, i) => {
      const mesh = meshes.current[i]
      if (!mesh) return
      const a = anim.current[i]
      const u = cards[i].material.uniforms
      if (visible) {
        a.delay -= dt
        if (a.delay <= 0) a.appear = Math.min(1, a.appear + dt * 1.1)
      } else {
        a.appear = Math.max(0, a.appear - dt * 2.5)
      }
      const isHover = !!event && hoveredEvent === event.id
      const isSelected = !!event && selectedEvent === event.id
      a.hover = THREE.MathUtils.damp(a.hover, isHover || isSelected ? 1 : 0, 8, dt)

      u.appear.value = a.appear
      u.hover.value = a.hover
      u.time.value = clock.elapsedTime
      u.loading.value = event ? 0 : 1
      u.selected.value = THREE.MathUtils.damp(u.selected.value, isSelected ? 1 : 0, 6, dt)
      u.dim.value = THREE.MathUtils.damp(u.dim.value, focus && event && focus !== event.id ? 1 : 0, 6, dt)

      // hovered card drifts towards the camera; all cards bob gently
      const base = layout.positions[i]
      toCamera.subVectors(camera.position, base)
      mesh.position
        .copy(base)
        .addScaledVector(toCamera, a.hover * 0.14)
        .addScaledVector(layout.north, Math.sin(clock.elapsedTime * 0.8 + i * 1.3) * layout.cardH * 0.02)
      mesh.quaternion.copy(camera.quaternion)
      mesh.scale.set(layout.cardW, layout.cardH, 1).multiplyScalar(1 + a.hover * 0.06)
      mesh.visible = a.appear > 0.001
      anyVisible ||= mesh.visible

      // beam from the card down to where the event happened
      if (event) {
        latLonToVector3(event.coordinates.lat, event.coordinates.lon, 1.002, ground)
        bottom.set(0, -0.5 * layout.cardH, 0).applyQuaternion(camera.quaternion).add(mesh.position)
        pos.setXYZ(i * 2, bottom.x, bottom.y, bottom.z)
        pos.setXYZ(i * 2 + 1, ground.x, ground.y, ground.z)
        matrix.makeScale(
          layout.markerSize * (1 + a.hover),
          layout.markerSize * (1 + a.hover),
          layout.markerSize * (1 + a.hover),
        )
        matrix.setPosition(ground)
        markers.setMatrixAt(i, matrix)
        markers.setColorAt(i, tmpColor.set(isHover || isSelected ? '#ffcf7a' : '#5aa6d6'))
      } else {
        pos.setXYZ(i * 2, 0, 0, 0)
        pos.setXYZ(i * 2 + 1, 0, 0, 0)
        markers.setMatrixAt(i, matrix.makeScale(0, 0, 0))
      }
    })
    pos.needsUpdate = true
    markers.instanceMatrix.needsUpdate = true
    if (markers.instanceColor) markers.instanceColor.needsUpdate = true
    const reveal = Math.min(...anim.current.slice(0, events.length).map((a) => a.appear), 1)
    ;(beams.material as THREE.LineBasicMaterial).opacity = 0.4 * reveal
    beams.visible = anyVisible && keyEvents.status === 'ready'
    markers.visible = beams.visible
    g.visible = anyVisible
  })

  const setCursor = (c: string) => (document.body.style.cursor = c)

  return (
    <group ref={group} visible={false}>
      {cards.map((card, i) => {
        const event = events[i]
        return (
          <mesh
            key={i}
            ref={(m) => {
              meshes.current[i] = m
            }}
            material={card.material}
            renderOrder={10}
            visible={false}
            raycast={event ? THREE.Mesh.prototype.raycast : noRaycast}
            onPointerOver={(e) => {
              if (!event || !active) return
              e.stopPropagation()
              useChronos.getState().hoverEvent(event.id)
              setCursor('pointer')
            }}
            onPointerOut={() => {
              if (!event) return
              if (useChronos.getState().hoveredEvent === event.id) useChronos.getState().hoverEvent(null)
              setCursor('')
            }}
            onClick={(e) => {
              if (!event || !active || e.delta > 6) return
              e.stopPropagation()
              const { selectedEvent, selectEvent } = useChronos.getState()
              selectEvent(selectedEvent === event.id ? null : event.id)
            }}
          >
            <planeGeometry args={[1, 1]} />
          </mesh>
        )
      })}
      <primitive object={beams} raycast={noRaycast} />
      <primitive object={markers} raycast={noRaycast} />
    </group>
  )
}

