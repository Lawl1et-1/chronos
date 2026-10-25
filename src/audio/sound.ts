/**
 * Procedural sound design with the Web Audio API: an ambient drone plus short cues.
 * Nothing is downloaded; everything is synthesised on the fly. Off by default.
 */

export type Cue = 'whoosh' | 'rise' | 'select' | 'shatter' | 'chime'

const PREF_KEY = 'chronos:sound'
// A minor pentatonic, for milestone chimes
const PENTATONIC = [440, 523.25, 587.33, 659.25, 783.99, 880]

let ctx: AudioContext | null = null
let master: GainNode | null = null
let noise: AudioBuffer | null = null
let enabled = false
let ambientStarted = false

function setup() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0
  const comp = ctx.createDynamicsCompressor()
  master.connect(comp).connect(ctx.destination)

  noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return ctx
}

function startAmbient(ac: AudioContext) {
  if (ambientStarted || !master) return
  ambientStarted = true

  // low drone: detuned oscillators through a slowly breathing low-pass
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 380
  filter.Q.value = 2
  const lfo = ac.createOscillator()
  const lfoGain = ac.createGain()
  lfo.frequency.value = 0.045
  lfoGain.gain.value = 160
  lfo.connect(lfoGain).connect(filter.frequency)
  lfo.start()

  const drone = ac.createGain()
  drone.gain.value = 0.06
  for (const [freq, type, detune] of [
    [55, 'sine', 0],
    [82.41, 'triangle', -7],
    [110, 'sine', 5],
    [164.81, 'sine', -3],
  ] as const) {
    const osc = ac.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    osc.detune.value = detune
    osc.connect(filter)
    osc.start()
  }
  filter.connect(drone).connect(master)

  // faint "space wind": band-passed noise
  const wind = ac.createBufferSource()
  wind.buffer = noise
  wind.loop = true
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 700
  band.Q.value = 0.6
  const windGain = ac.createGain()
  windGain.gain.value = 0.012
  wind.connect(band).connect(windGain).connect(master)
  wind.start()
}

function envelope(gain: GainNode, t: number, attack: number, peak: number, release: number) {
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + release)
}

function noiseSource(ac: AudioContext) {
  const src = ac.createBufferSource()
  src.buffer = noise
  src.loop = true
  return src
}

const cues: Record<Cue, (ac: AudioContext, out: AudioNode) => void> = {
  whoosh(ac, out) {
    const t = ac.currentTime
    const src = noiseSource(ac)
    const band = ac.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.2
    band.frequency.setValueAtTime(260, t)
    band.frequency.exponentialRampToValueAtTime(2200, t + 0.55)
    band.frequency.exponentialRampToValueAtTime(380, t + 1.3)
    const g = ac.createGain()
    envelope(g, t, 0.45, 0.16, 0.9)
    src.connect(band).connect(g).connect(out)
    src.start(t)
    src.stop(t + 1.5)
  },
  rise(ac, out) {
    const t = ac.currentTime
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(110, t)
    osc.frequency.exponentialRampToValueAtTime(330, t + 2.2)
    const lp = ac.createBiquadFilter()
    lp.type = 'lowpass'
    lp.frequency.setValueAtTime(200, t)
    lp.frequency.exponentialRampToValueAtTime(1400, t + 2.2)
    const g = ac.createGain()
    envelope(g, t, 1.6, 0.07, 1.2)
    osc.connect(lp).connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 3)
  },
  select(ac, out) {
    const t = ac.currentTime
    for (const [freq, peak] of [
      [880, 0.06],
      [1760, 0.02],
    ]) {
      const osc = ac.createOscillator()
      osc.frequency.setValueAtTime(freq, t)
      osc.frequency.exponentialRampToValueAtTime(freq * 0.75, t + 0.18)
      const g = ac.createGain()
      envelope(g, t, 0.005, peak, 0.25)
      osc.connect(g).connect(out)
      osc.start(t)
      osc.stop(t + 0.3)
    }
  },
  shatter(ac, out) {
    const t = ac.currentTime
    const src = noiseSource(ac)
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 1200
    const g = ac.createGain()
    envelope(g, t, 0.004, 0.32, 0.7)
    src.connect(hp).connect(g).connect(out)
    src.start(t)
    src.stop(t + 0.8)
    // glassy fragments scattered over the first half-second
    for (let i = 0; i < 9; i++) {
      const at = t + Math.random() * 0.5
      const osc = ac.createOscillator()
      osc.type = 'triangle'
      osc.frequency.value = 2200 + Math.random() * 3200
      const pg = ac.createGain()
      envelope(pg, at, 0.002, 0.03 + Math.random() * 0.03, 0.18)
      osc.connect(pg).connect(out)
      osc.start(at)
      osc.stop(at + 0.25)
    }
  },
  chime(ac, out) {
    const t = ac.currentTime
    const osc = ac.createOscillator()
    osc.frequency.value = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)]
    const g = ac.createGain()
    envelope(g, t, 0.01, 0.045, 1.4)
    osc.connect(g).connect(out)
    osc.start(t)
    osc.stop(t + 1.6)
  },
}

export const sound = {
  get enabled() {
    return enabled
  },
  /** Must be called from a user gesture the first time (browser autoplay rules). */
  async setEnabled(on: boolean) {
    enabled = on
    try {
      localStorage.setItem(PREF_KEY, on ? '1' : '0')
    } catch {
      // preference is a convenience only
    }
    if (!on && !ctx) return
    const ac = setup()
    if (on) {
      await ac.resume()
      startAmbient(ac)
    }
    master!.gain.cancelScheduledValues(ac.currentTime)
    master!.gain.setTargetAtTime(on ? 0.9 : 0, ac.currentTime, 0.4)
  },
  play(cue: Cue) {
    if (!enabled || !ctx || !master || ctx.state !== 'running') return
    cues[cue](ctx, master)
  },
  /** The saved preference, applied on the first user gesture. */
  savedPreference() {
    try {
      return localStorage.getItem(PREF_KEY) === '1'
    } catch {
      return false
    }
  },
}
