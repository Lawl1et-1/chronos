import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Bloom, ChromaticAberration, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction, type BloomEffect, type ChromaticAberrationEffect } from 'postprocessing'
import * as THREE from 'three'
import { fx } from './fx'

const BLOOM = 0.85

/** Post-processing stack; transitions briefly add chromatic aberration and bloom. */
export function Effects({ multisampling }: { multisampling: number }) {
  const bloom = useRef<BloomEffect>(null)
  const aberration = useRef<ChromaticAberrationEffect>(null)

  useFrame((_, dt) => {
    fx.pulse = THREE.MathUtils.damp(fx.pulse, 0, 2.2, dt)
    fx.flash = THREE.MathUtils.damp(fx.flash, 0, 1.6, dt)
    // a small idle aberration keeps the lens feel; transitions push it further
    const offset = 0.0004 + fx.pulse * 0.004
    aberration.current?.offset.set(offset, offset * 0.6)
    if (bloom.current) bloom.current.intensity = BLOOM + fx.flash
  })

  return (
    <EffectComposer multisampling={multisampling}>
      <Bloom ref={bloom} mipmapBlur intensity={BLOOM} luminanceThreshold={0.62} luminanceSmoothing={0.25} />
      <ChromaticAberration ref={aberration} radialModulation modulationOffset={0.25} />
      <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
      <Vignette offset={0.28} darkness={0.82} />
    </EffectComposer>
  )
}
