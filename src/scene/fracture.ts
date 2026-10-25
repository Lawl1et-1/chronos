import * as THREE from 'three'
import { CARD_H, CARD_W } from './cardTexture'
import { fractureFragment, fractureVertex } from './shaders/fracture'

const MAX = 6000
const STEP = 9

/** One reusable burst of square shards sampled from a card's own pixels. */
export function createFracture(duration: number) {
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3))
  geometry.setAttribute('velocity', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(MAX * 3), 3))
  geometry.setAttribute('seed', new THREE.BufferAttribute(new Float32Array(MAX), 1))
  const material = new THREE.ShaderMaterial({
    vertexShader: fractureVertex,
    fragmentShader: fractureFragment,
    uniforms: { time: { value: 0 }, duration: { value: duration }, size: { value: 1 }, pixelRatio: { value: 1 } },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    toneMapped: false,
  })
  const points = new THREE.Points(geometry, material)
  points.frustumCulled = false
  points.visible = false
  points.raycast = () => null

  const center = new THREE.Vector3()
  const toCamera = new THREE.Vector3()
  const p = new THREE.Vector3()
  const v = new THREE.Vector3()
  const jitter = new THREE.Vector3()

  return {
    points,
    burst(
      canvas: HTMLCanvasElement,
      mesh: THREE.Object3D,
      camera: THREE.PerspectiveCamera,
      cardW: number,
      viewportHeight: number,
      pixelRatio: number,
    ) {
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, CARD_W, CARD_H).data
      const pos = geometry.attributes.position as THREE.BufferAttribute
      const vel = geometry.attributes.velocity as THREE.BufferAttribute
      const col = geometry.attributes.color as THREE.BufferAttribute
      const seed = geometry.attributes.seed as THREE.BufferAttribute
      mesh.updateMatrixWorld()
      mesh.getWorldPosition(center)
      toCamera.subVectors(camera.position, center).normalize()

      let n = 0
      for (let y = 0; y < CARD_H && n < MAX; y += STEP) {
        for (let x = 0; x < CARD_W && n < MAX; x += STEP) {
          const i = (y * CARD_W + x) * 4
          if (pixels[i + 3] < 30) continue
          p.set(x / CARD_W - 0.5, 0.5 - y / CARD_H, 0).applyMatrix4(mesh.matrixWorld)
          v.subVectors(p, center)
            .normalize()
            .multiplyScalar((0.5 + Math.random() * 1.3) * cardW)
          v.addScaledVector(toCamera, Math.random() * 0.9 * cardW)
          v.addScaledVector(jitter.randomDirection(), 0.35 * cardW)
          pos.setXYZ(n, p.x, p.y, p.z)
          vel.setXYZ(n, v.x, v.y, v.z)
          // canvas pixels are sRGB; the scene works in linear light
          col.setXYZ(n, (pixels[i] / 255) ** 2.2, (pixels[i + 1] / 255) ** 2.2, (pixels[i + 2] / 255) ** 2.2)
          seed.setX(n, Math.random())
          n++
        }
      }
      for (const a of [pos, vel, col, seed]) a.needsUpdate = true
      geometry.setDrawRange(0, n)

      // shard size in pixels ≈ its size in the world, projected
      const shard = (STEP / CARD_W) * cardW
      material.uniforms.size.value = (shard * viewportHeight) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))
      material.uniforms.pixelRatio.value = pixelRatio
      material.uniforms.time.value = 0
      points.visible = true
    },
    update(dt: number) {
      if (!points.visible) return
      material.uniforms.time.value += dt
      if (material.uniforms.time.value > duration) points.visible = false
    },
    dispose() {
      geometry.dispose()
      material.dispose()
    },
  }
}
