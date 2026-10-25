import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Bloom, EffectComposer, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { Globe } from './Globe'
import { Atmosphere, Clouds } from './Atmosphere'
import { Starfield } from './Starfield'
import { CameraRig } from './CameraRig'
import { TimeSpiral } from './TimeSpiral'
import { Monoliths } from './Monoliths'

export function Experience() {
  return (
    <Canvas
      camera={{ position: [0, 1.1, 4.8], fov: 42, near: 0.01, far: 300 }}
      dpr={[1, 2]}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020308']} />
      <Starfield />
      <Suspense fallback={null}>
        <Globe />
        <Clouds />
        <Atmosphere />
        <TimeSpiral />
        <Monoliths />
      </Suspense>
      <CameraRig />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.62} luminanceSmoothing={0.25} />
        <Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.35} />
        <Vignette offset={0.28} darkness={0.82} />
      </EffectComposer>
    </Canvas>
  )
}
