import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { latLonToVector3 } from '../lib/geo'
import { selectedCountry, useChronos } from '../store/useChronos'
import { sunDir } from './sun'

const DIST_INTRO = 4.8
const DIST_GLOBE = 3.3
const FLIGHT_SECONDS = 2.1

interface Flight {
  fromDir: THREE.Vector3
  toDir: THREE.Vector3
  fromDist: number
  toDist: number
  t: number
}

const easeInOutCubic = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)

const ySpin = new THREE.Quaternion()
const tmp = new THREE.Vector3()
const q = new THREE.Quaternion()
const identity = new THREE.Quaternion()

/** Owns the camera: orbit controls when idle, scripted flights between phases. */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const controls = useRef<OrbitControlsImpl>(null)
  const size = useThree((s) => s.size)
  const flight = useRef<Flight | null>(null)
  const offset = useRef({ x: 0, y: 0 }).current

  const phase = useChronos((s) => s.phase)
  const target = useChronos(selectedCountry)

  useEffect(() => {
    const fromDir = camera.position.clone().normalize()
    const fromDist = camera.position.length()
    let toDir = fromDir.clone()
    let toDist = phase === 'intro' ? DIST_INTRO : DIST_GLOBE
    if (phase === 'zone' && target) {
      toDir = latLonToVector3(target.center[0], target.center[1], 1)
      toDist = 1 + THREE.MathUtils.clamp(target.extent * 3.8, 0.5, 2.1)
    }
    flight.current = { fromDir, toDir, fromDist, toDist, t: 0 }
  }, [phase, target, camera])

  useFrame((_, dt) => {
    const c = controls.current
    const f = flight.current
    if (f) {
      f.t = Math.min(1, f.t + dt / FLIGHT_SECONDS)
      const e = easeInOutCubic(f.t)
      q.setFromUnitVectors(f.fromDir, f.toDir)
      const angle = f.fromDir.angleTo(f.toDir)
      tmp.copy(f.fromDir).applyQuaternion(identity.clone().slerp(q, e))
      // pull back mid-flight on long arcs, like a real camera move
      const dist = THREE.MathUtils.lerp(f.fromDist, f.toDist, e) + Math.sin(Math.PI * e) * angle * 0.35
      camera.position.copy(tmp.multiplyScalar(dist))
      camera.lookAt(0, 0, 0)
      if (f.t >= 1) flight.current = null
    }
    if (c) {
      c.enabled = !flight.current && phase !== 'intro'
      c.autoRotate = !flight.current && phase !== 'zone'
      c.autoRotateSpeed = phase === 'intro' ? 0.35 : 0.22
      c.update()
    }
    // shift the projection so the focused country sits beside the zone panel
    // (right of the screen on desktop, bottom on mobile)
    const { width, height } = size
    const wide = width >= 640
    const focus = phase === 'zone' ? 1 : 0
    offset.x = THREE.MathUtils.damp(offset.x, wide ? focus * Math.min(200, width * 0.16) : 0, 3, dt)
    offset.y = THREE.MathUtils.damp(offset.y, wide ? 0 : focus * height * 0.18, 3, dt)
    const cam = camera as THREE.PerspectiveCamera
    if (Math.abs(offset.x) + Math.abs(offset.y) > 0.5) cam.setViewOffset(width, height, offset.x, offset.y, width, height)
    else if (cam.view?.enabled) cam.clearViewOffset()

    // keep the sun offset from the view so the terminator stays in frame
    ySpin.setFromAxisAngle(THREE.Object3D.DEFAULT_UP, 0.95)
    sunDir.copy(camera.position).normalize().applyQuaternion(ySpin)
    sunDir.y += 0.25
    sunDir.normalize()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enablePan={false}
      enableDamping
      dampingFactor={0.07}
      rotateSpeed={0.45}
      zoomSpeed={0.6}
      minDistance={1.25}
      maxDistance={6}
    />
  )
}
