import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import { Globe } from './Globe'
import { Atmosphere, Clouds } from './Atmosphere'
import { Starfield } from './Starfield'
import { CameraRig } from './CameraRig'
import { TimeSpiral } from './TimeSpiral'
import { Monoliths } from './Monoliths'
import { TimelineBranch } from './TimelineBranch'
import { Effects } from './Effects'

const MAX_DPR = Math.min(window.devicePixelRatio, 2)

export function Experience() {
  // resolution adapts to the machine: lowered when the frame rate drops, raised back when it recovers
  const [dpr, setDpr] = useState(Math.min(MAX_DPR, 1.5))
  const [multisampling, setMultisampling] = useState(4)

  return (
    <Canvas
      camera={{ position: [0, 1.1, 4.8], fov: 42, near: 0.01, far: 300 }}
      dpr={dpr}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={(state) => {
        // handle for debugging in the browser console during development
        if (import.meta.env.DEV) Object.assign(window, { __r3f: state })
      }}
    >
      <PerformanceMonitor
        bounds={() => [50, 58]}
        flipflops={3}
        onIncline={() => {
          setDpr((d) => Math.min(MAX_DPR, d + 0.25))
          setMultisampling(4)
        }}
        onDecline={() => {
          setDpr((d) => Math.max(1, d - 0.25))
          setMultisampling(0)
        }}
        onFallback={() => {
          setDpr(1)
          setMultisampling(0)
        }}
      />
      <color attach="background" args={['#020308']} />
      <Starfield />
      <Suspense fallback={null}>
        <Globe />
        <Clouds />
        <Atmosphere />
        <TimeSpiral />
        <Monoliths />
        <TimelineBranch />
      </Suspense>
      <CameraRig />
      <Effects multisampling={multisampling} />
    </Canvas>
  )
}
