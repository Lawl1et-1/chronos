import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { ringsToSegments, type CountryData } from '../lib/countries'
import { useChronos } from '../store/useChronos'

interface Props {
  data: CountryData
}

const noRaycast = () => null

/** All borders in one draw call, plus a brighter outline for the hovered and selected countries. */
export function Countries({ data }: Props) {
  const hovered = useChronos((s) => s.hovered)
  const selected = useChronos((s) => s.selected)
  const bordersMat = useRef<THREE.LineBasicMaterial>(null)

  useEffect(() => {
    const { setCountries } = useChronos.getState()
    setCountries(data.countries)
  }, [data])

  const hoverGeom = useMemo(
    () => (hovered && hovered !== selected ? ringsToSegments(data.countries[hovered - 1].feature, 1.002) : null),
    [data, hovered, selected],
  )
  const selectedGeom = useMemo(
    () => (selected ? ringsToSegments(data.countries[selected - 1].feature, 1.0025) : null),
    [data, selected],
  )
  useEffect(() => () => hoverGeom?.dispose(), [hoverGeom])
  useEffect(() => () => selectedGeom?.dispose(), [selectedGeom])

  useFrame((_, dt) => {
    const m = bordersMat.current
    if (!m) return
    const { phase, selected } = useChronos.getState()
    const target = phase === 'intro' ? 0.12 : selected ? 0.16 : 0.32
    m.opacity = THREE.MathUtils.damp(m.opacity, target, 3, dt)
  })

  return (
    <>
      <lineSegments geometry={data.borders} raycast={noRaycast}>
        <lineBasicMaterial ref={bordersMat} color="#a9dcff" transparent opacity={0} depthWrite={false} />
      </lineSegments>
      {hoverGeom && (
        <lineSegments geometry={hoverGeom} raycast={noRaycast}>
          <lineBasicMaterial color="#c6ecff" transparent opacity={0.95} depthWrite={false} />
        </lineSegments>
      )}
      {selectedGeom && (
        <lineSegments geometry={selectedGeom} raycast={noRaycast}>
          <lineBasicMaterial color="#ffd38a" transparent opacity={1} depthWrite={false} toneMapped={false} />
        </lineSegments>
      )}
    </>
  )
}
