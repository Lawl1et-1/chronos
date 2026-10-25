import { useEffect, useRef, useState } from 'react'
import { keyEventsData, useChronos } from '../store/useChronos'

/** Detail shown next to the pointer while hovering a monolith in the scene. */
export function EventTooltip() {
  const ref = useRef<HTMLDivElement>(null)
  const [overScene, setOverScene] = useState(false)
  const data = useChronos(keyEventsData)
  const hoveredEvent = useChronos((s) => s.hoveredEvent)
  const selectedEvent = useChronos((s) => s.selectedEvent)
  const phase = useChronos((s) => s.phase)

  useEffect(() => {
    const move = (e: PointerEvent) => {
      setOverScene(e.target instanceof HTMLCanvasElement)
      const el = ref.current
      if (!el) return
      // keep the card inside the viewport
      const x = Math.min(e.clientX + 18, window.innerWidth - el.offsetWidth - 12)
      const y = Math.min(e.clientY + 16, window.innerHeight - el.offsetHeight - 12)
      el.style.transform = `translate(${x}px, ${y}px)`
    }
    window.addEventListener('pointermove', move)
    return () => window.removeEventListener('pointermove', move)
  }, [])

  const event = data?.events.find((e) => e.id === hoveredEvent)
  const visible = phase === 'events' && overScene && !!event && event.id !== selectedEvent

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed top-0 left-0 z-20 w-72 transition-opacity duration-200"
      style={{ opacity: visible ? 1 : 0 }}
      aria-hidden
    >
      {event && (
        <div className="glass rounded-xl p-4">
          <p className="font-mono text-[10px] tracking-[0.2em] text-real uppercase">{event.date}</p>
          <p className="mt-1 font-display text-xl leading-tight">{event.title}</p>
          <p className="mt-2 text-xs leading-relaxed text-parchment/80">{event.whyItMattered}</p>
          <p className="mt-2 font-mono text-[10px] text-dust">Cliquer pour le détail</p>
        </div>
      )}
    </div>
  )
}
