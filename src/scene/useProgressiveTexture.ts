import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'

/** Suspends on a small texture, then swaps in the full-resolution one in the background. */
export function useProgressiveTexture(name: string, srgb = true) {
  const gl = useThree((s) => s.gl)
  const lo = useTexture(`/textures/${name}-lo.webp`)
  const [texture, setTexture] = useState<THREE.Texture>(lo)

  useEffect(() => {
    const configure = (t: THREE.Texture) => {
      t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
      t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy())
      t.needsUpdate = true
    }
    configure(lo)
    let alive = true
    new THREE.TextureLoader().load(`/textures/${name}.webp`, (hi) => {
      if (!alive) return hi.dispose()
      configure(hi)
      setTexture(hi)
    })
    return () => {
      alive = false
    }
  }, [name, lo, srgb, gl])

  return texture
}
