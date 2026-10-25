import { useEffect, useState } from 'react'
import { sound } from '../audio/sound'
import { useT } from '../i18n'
import { useChronos } from '../store/useChronos'

export function SoundToggle() {
  const phase = useChronos((s) => s.phase)
  const t = useT()
  const [on, setOn] = useState(false)

  // browsers only allow audio after a gesture: restore the saved choice on the first one
  useEffect(() => {
    if (!sound.savedPreference()) return
    const resume = () => {
      void sound.setEnabled(true)
      setOn(true)
    }
    window.addEventListener('pointerdown', resume, { once: true })
    return () => window.removeEventListener('pointerdown', resume)
  }, [])

  if (phase === 'intro') return null
  const label = on ? t('sound.off') : t('sound.on')

  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      title={label}
      onClick={() => {
        void sound.setEnabled(!on)
        setOn(!on)
      }}
      className="glass flex h-10 w-10 items-center justify-center rounded-full text-parchment/80 transition-colors hover:text-parchment focus-visible:outline-2 focus-visible:outline-real"
    >
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" strokeLinejoin="round" />
        {on ? (
          <>
            <path d="M15.5 9a4 4 0 0 1 0 6" strokeLinecap="round" />
            <path d="M18 6.5a7.5 7.5 0 0 1 0 11" strokeLinecap="round" />
          </>
        ) : (
          <path d="M16 9.5l5 5m0-5l-5 5" strokeLinecap="round" />
        )}
      </svg>
    </button>
  )
}
