import { useState } from 'react'
import { ApiRequestError, createShare } from '../api/client'
import { buildSharePayload, shareUrl } from '../lib/share'

type State = { kind: 'idle' } | { kind: 'busy' } | { kind: 'done'; url: string; copied: boolean } | { kind: 'error'; message: string }

export function ShareButton({ className = '' }: { className?: string }) {
  const [state, setState] = useState<State>({ kind: 'idle' })

  const share = async () => {
    const payload = buildSharePayload()
    if (!payload) {
      setState({ kind: 'error', message: 'Attendez la fin de la chronologie pour la partager.' })
      return
    }
    setState({ kind: 'busy' })
    try {
      const url = shareUrl(await createShare(payload))
      let copied = false
      try {
        await navigator.clipboard.writeText(url)
        copied = true
      } catch {
        // clipboard refused: the link is shown so it can be copied by hand
      }
      setState({ kind: 'done', url, copied })
    } catch (error) {
      setState({ kind: 'error', message: error instanceof ApiRequestError ? error.message : 'Partage impossible.' })
    }
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void share()}
        disabled={state.kind === 'busy'}
        className="rounded-full border border-parchment/20 px-4 py-2 font-mono text-[11px] tracking-[0.2em] uppercase transition-colors hover:border-alt/60 hover:text-alt focus-visible:outline-2 focus-visible:outline-alt disabled:opacity-50"
      >
        {state.kind === 'busy' ? 'Création du lien…' : 'Partager'}
      </button>
      {state.kind === 'done' && (
        <div className="mt-2" aria-live="polite">
          <p className="text-xs text-alt">{state.copied ? 'Lien copié dans le presse-papiers.' : 'Lien prêt :'}</p>
          <input
            readOnly
            value={state.url}
            onFocus={(e) => e.target.select()}
            aria-label="Lien de partage"
            className="mt-1 w-full rounded-md border border-parchment/15 bg-transparent px-2 py-1 font-mono text-[11px] text-parchment/80 focus:outline-none"
          />
        </div>
      )}
      {state.kind === 'error' && (
        <p className="mt-2 text-xs text-rupture" role="alert">
          {state.message}
        </p>
      )}
    </div>
  )
}
