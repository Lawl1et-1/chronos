/** Transient post-processing energy, kicked by transitions and decayed every frame. */
export const fx = {
  /** Chromatic aberration pulse (camera moves between steps). */
  pulse: 0,
  /** Extra bloom (fracture, branch appearing). */
  flash: 0,
}

const reducedMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export function kick(pulse: number, flash = 0) {
  if (reducedMotion) return
  fx.pulse = Math.max(fx.pulse, pulse)
  fx.flash = Math.max(fx.flash, flash)
}

export function prefersReducedMotion() {
  return reducedMotion
}
