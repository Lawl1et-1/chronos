import { sound } from './audio/sound'
import { kick } from './scene/fx'
import { useChronos } from './store/useChronos'

/**
 * Turns state changes into sound cues and visual pulses, so components don't each
 * have to know about audio or post-processing. Returns an unsubscribe function.
 */
export function startDirector() {
  return useChronos.subscribe((s, prev) => {
    if (s.phase !== prev.phase && prev.phase !== 'intro') {
      if (s.phase === 'alternate') {
        sound.play('rise')
        kick(1.2, 0.8)
      } else {
        sound.play('whoosh')
        kick(0.8)
      }
    } else if (s.phase !== prev.phase) {
      sound.play('whoosh')
      kick(0.5)
    }

    if (s.selected && s.selected !== prev.selected) sound.play('select')
    if (s.selectedEvent && s.selectedEvent !== prev.selectedEvent) sound.play('select')
    if (s.selectedNode !== null && s.selectedNode !== prev.selectedNode) sound.play('select')

    if (s.fracturing && !prev.fracturing) {
      sound.play('shatter')
      kick(0.6, 1.6)
    }

    // one chime per milestone as the alternate timeline streams in
    const count = (a: typeof s.alternate) =>
      a.status === 'streaming' || a.status === 'error'
        ? (a.partial?.timeline.length ?? 0)
        : a.status === 'ready'
          ? a.data.timeline.length
          : 0
    const added = count(s.alternate) - count(prev.alternate)
    if (s.alternate.status === 'streaming' && added > 0) sound.play('chime')
  })
}
