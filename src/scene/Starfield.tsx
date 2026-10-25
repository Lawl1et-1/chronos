import { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { starsFragment, starsVertex } from './shaders/earth'

const COUNT = 7000

/** A single Points draw call: random shell of stars with per-star size, tint and twinkle. */
export function Starfield() {
  const dpr = useThree((s) => s.viewport.dpr)

  const geometry = useMemo(() => {
    const positions = new Float32Array(COUNT * 3)
    const sizes = new Float32Array(COUNT)
    const phases = new Float32Array(COUNT)
    const tints = new Float32Array(COUNT * 3)
    const v = new THREE.Vector3()
    const c = new THREE.Color()
    for (let i = 0; i < COUNT; i++) {
      v.randomDirection().multiplyScalar(45 + Math.random() * 40)
      positions.set([v.x, v.y, v.z], i * 3)
      sizes[i] = Math.random() < 0.03 ? 2.4 + Math.random() * 1.6 : 0.6 + Math.random() * 1.1
      phases[i] = Math.random()
      c.setHSL(0.55 + (Math.random() - 0.5) * 0.18, 0.35 * Math.random(), 0.75 + Math.random() * 0.25)
      tints.set([c.r, c.g, c.b], i * 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    g.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    g.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    g.setAttribute('tint', new THREE.BufferAttribute(tints, 3))
    return g
  }, [])

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: starsVertex,
        fragmentShader: starsFragment,
        uniforms: { time: { value: 0 }, pixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [],
  )
  material.uniforms.pixelRatio.value = dpr

  useFrame((_, dt) => {
    material.uniforms.time.value += dt
  })

  return <points geometry={geometry} material={material} raycast={() => null} />
}
