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

    // a new sub-branch grows out of a milestone
    if (s.phase === 'alternate' && s.branches.length > prev.branches.length && prev.branches.length > 0) {
      sound.play('rise')
      kick(0.8, 0.6)
    }

    // one chime per milestone as a timeline streams in
    const streamed = (state: typeof s) =>
      state.branches.reduce((n, b) => n + (b.status === 'streaming' ? (b.partial?.timeline.length ?? 0) : 0), 0)
    if (streamed(s) > streamed(prev)) sound.play('chime')
  })
}
