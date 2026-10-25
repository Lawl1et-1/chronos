/**
 * The AI engine used by the static build (GitHub Pages), where there is no server:
 * calls go straight from the visitor's browser to Gemini with their own key, or fall
 * back to the built-in demo when no key is set.
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
import { demoAlternate, demoKeyEvents } from '../../shared/demo'
import { KEY_EVENTS_SYSTEM, keyEventsPrompt } from '../../shared/prompts/keyEvents'
import { ALTERNATE_SYSTEM, alternatePrompt } from '../../shared/prompts/alternateHistory'
import { geminiProvider } from '../../shared/llm/gemini'
import { generateStructured, streamStructured } from '../../shared/llm/structured'
import { LlmError, type Provider } from '../../shared/llm/types'
import { completedParts, partialSignature } from '../../shared/partial'

let cached: { key: string; provider: Provider } | null = null
function provider(key: string) {
  if (cached?.key !== key) cached = { key, provider: geminiProvider({ apiKey: key }) }
  return cached.provider
}

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal?.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new DOMException('aborted', 'AbortError'))
    })
  })

export async function keyEvents(req: KeyEventsRequest, key: string | null, signal?: AbortSignal) {
  if (!key) {
    await sleep(900, signal)
    return demoKeyEvents(req.lang)
  }
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
  if (!key) {
    // replay the demo scenario at a reading pace
    const demo = demoAlternate(req.lang, !!req.history?.length)
    const { divergencePoint, butterflyEffects, timeline } = demo
    await sleep(900, signal)
    onPartial({ divergencePoint, timeline: [] })
    await sleep(900, signal)
    onPartial({ divergencePoint, butterflyEffects, timeline: [] })
    for (let i = 1; i <= timeline.length; i++) {
      await sleep(650, signal)
      onPartial({ divergencePoint, butterflyEffects, timeline: timeline.slice(0, i) })
    }
    return demo
  }

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
