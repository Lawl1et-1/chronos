import { use, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { loadCountries } from '../lib/countries'
import { useChronos } from '../store/useChronos'
import { earthFragment, earthVertex } from './shaders/earth'
import { sunDir } from './sun'
import { useProgressiveTexture } from './useProgressiveTexture'
import { Countries } from './Countries'

// start fetching everything in parallel instead of waterfalling behind Suspense
loadCountries()
for (const name of ['earth-day', 'earth-night', 'earth-water', 'clouds']) useTexture.preload(`/textures/${name}-lo.webp`)

export function Globe() {
  const data = use(loadCountries())
  const day = useProgressiveTexture('earth-day')
  const night = useProgressiveTexture('earth-night')
  const water = useProgressiveTexture('earth-water', false)

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: earthVertex,
        fragmentShader: earthFragment,
        uniforms: {
          dayMap: { value: null },
          nightMap: { value: null },
          waterMap: { value: null },
          idMap: { value: data.idTexture },
          sunDir: { value: sunDir },
          hovered: { value: 0 },
          selected: { value: 0 },
          focus: { value: 0 },
          time: { value: 0 },
        },
      }),
    [data],
  )
  material.uniforms.dayMap.value = day
  material.uniforms.nightMap.value = night
  material.uniforms.waterMap.value = water

  useFrame((_, dt) => {
    const { hovered, selected, phase } = useChronos.getState()
    const u = material.uniforms
    u.time.value += dt
    u.hovered.value = phase === 'globe' || phase === 'zone' ? hovered : 0
    u.selected.value = selected
    u.focus.value = THREE.MathUtils.damp(u.focus.value, selected ? 1 : 0, 3, dt)
  })

  const pointerIndex = (e: ThreeEvent<PointerEvent | MouseEvent>) => (e.uv ? data.indexAtUv(e.uv.x, e.uv.y) : 0)
  const lastCursor = useRef('')
  const setCursor = (c: string) => {
    if (lastCursor.current !== c) document.body.style.cursor = lastCursor.current = c
  }

  return (
    <group>
      <mesh
        material={material}
        onPointerMove={(e) => {
          const { phase } = useChronos.getState()
          if (phase !== 'globe' && phase !== 'zone') return
          const i = pointerIndex(e)
          useChronos.getState().hover(i)
          setCursor(i ? 'pointer' : '')
        }}
        onPointerOut={() => {
          useChronos.getState().hover(0)
          setCursor('')
        }}
        onClick={(e) => {
          const state = useChronos.getState()
          if ((state.phase !== 'globe' && state.phase !== 'zone') || e.delta > 6) return
          const i = pointerIndex(e)
          if (i) state.select(i)
        }}
      >
        <sphereGeometry args={[1, 160, 120]} />
      </mesh>
      <Countries data={data} />
    </group>
  )
}
