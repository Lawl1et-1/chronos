import { useEffect, useRef } from 'react'
import { hoveredCountry, useChronos } from '../store/useChronos'

/** Follows the pointer without re-rendering on every move. */
export function CountryTooltip() {
  const ref = useRef<HTMLDivElement>(null)
  const country = useChronos(hoveredCountry)
  const selected = useChronos((s) => s.selected)
  const phase = useChronos((s) => s.phase)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (ref.current) ref.current.style.transform = `translate(${e.clientX + 16}px, ${e.clientY + 14}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const visible = phase !== 'intro' && country && country.index !== selected

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-20 transition-opacity duration-150"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div className="glass rounded-md px-3 py-1.5 text-sm whitespace-nowrap">{country?.name}</div>
    </div>
  )
}
