import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useChronos } from '../store/useChronos'
import { atmosphereFragment, atmosphereVertex, cloudsFragment, earthVertex } from './shaders/earth'
import { sunDir } from './sun'
import { useProgressiveTexture } from './useProgressiveTexture'

const noRaycast = () => null

export function Clouds() {
  const map = useProgressiveTexture('clouds', false)
  const mesh = useRef<THREE.Mesh>(null)
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: cloudsFragment,
        uniforms: { cloudMap: { value: null }, sunDir: { value: sunDir }, opacity: { value: 0.9 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  material.uniforms.cloudMap.value = map

  useFrame((_, dt) => {
    if (mesh.current) mesh.current.rotation.y += dt * 0.004
    // thin the clouds while a country is in focus so it stays readable
    const target = useChronos.getState().selected ? 0.35 : 0.9
    material.uniforms.opacity.value = THREE.MathUtils.damp(material.uniforms.opacity.value, target, 2.5, dt)
  })

  return (
    <mesh ref={mesh} material={material} raycast={noRaycast}>
      <sphereGeometry args={[1.008, 128, 96]} />
    </mesh>
  )
}

export function Atmosphere() {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { sunDir: { value: sunDir } },
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  return (
    <mesh material={material} raycast={noRaycast} scale={1.13}>
      <sphereGeometry args={[1, 96, 64]} />
    </mesh>
  )
}
