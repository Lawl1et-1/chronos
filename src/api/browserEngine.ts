/**
 * The AI engine used by the static build (GitHub Pages), where there is no server:
 * calls go through the site's AI proxy (which holds the key), or straight to Gemini
 * when a key was saved in this browser.
 */
import {
  AlternateOutputSchema,
  AlternateResultSchema,
  KeyEventsOutputSchema,
  KeyEventsResultSchema,
  type AlternatePartial,
  type AlternateRequest,
  type AlternateResponse,
  type KeyEventsRequest,
  type KeyEventsResponse,
} from '../../shared/schemas'
import { KEY_EVENTS_SYSTEM, keyEventsPrompt } from '../../shared/prompts/keyEvents'
import { ALTERNATE_SYSTEM, alternatePrompt } from '../../shared/prompts/alternateHistory'
import { geminiProvider } from '../../shared/llm/gemini'
import { generateStructured, streamStructured } from '../../shared/llm/structured'
import { LlmError, type Provider } from '../../shared/llm/types'
import { completedParts, partialSignature } from '../../shared/partial'

/** The site's AI proxy (keeps the key server-side), set at build time. */
const PROXY = import.meta.env.VITE_AI_PROXY as string | undefined

let cached: { id: string; provider: Provider } | null = null
function provider(key: string | null) {
  const id = key ?? PROXY ?? ''
  if (!id) throw new LlmError('Clé API absente.', 'missing_key', 503)
  if (cached?.id !== id) {
    cached = {
      id,
      // through the proxy the SDK still needs a key value: the proxy replaces it
      provider: key ? geminiProvider({ apiKey: key }) : geminiProvider({ apiKey: 'proxy', baseUrl: PROXY }),
    }
  }
  return cached.provider
}

export async function keyEvents(req: KeyEventsRequest, key: string | null, signal?: AbortSignal) {
  const data = await generateStructured(provider(key), {
    system: KEY_EVENTS_SYSTEM,
    prompt: keyEventsPrompt(req),
    output: KeyEventsOutputSchema,
    validate: KeyEventsResultSchema,
    signal,
  })
  return { ...data, zone: req.zone, year: req.year, demo: false } satisfies KeyEventsResponse
}

interface StreamHandlers {
  onPartial: (partial: AlternatePartial) => void
  onReset: () => void
  signal?: AbortSignal
}

export async function alternateHistory(
  req: AlternateRequest,
  key: string | null,
  { onPartial, onReset, signal }: StreamHandlers,
): Promise<AlternateResponse> {
  let signature = ''
  const data = await streamStructured(provider(key), {
    system: ALTERNATE_SYSTEM,
    prompt: alternatePrompt(req),
    output: AlternateOutputSchema,
    validate: AlternateResultSchema,
    signal,
    onText: (snapshot) => {
      const partial = completedParts(snapshot)
      if (!partial) return
      const next = partialSignature(partial)
      if (next === signature) return
      signature = next
      onPartial(partial)
    },
    onRetry: () => {
      signature = ''
      onReset()
    },
  })
  return { ...data, demo: false }
}

export { LlmError }
