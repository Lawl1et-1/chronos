import { ApiError, FinishReason, GoogleGenAI, type GenerateContentResponse } from '@google/genai'
import { z } from 'zod'
import { LlmError, type JsonRequest, type JsonResult, type Provider } from './types'

const REFUSALS = new Set<string>([
  FinishReason.SAFETY,
  FinishReason.PROHIBITED_CONTENT,
  FinishReason.BLOCKLIST,
  FinishReason.SPII,
  FinishReason.RECITATION,
])

const isAbort = (e: unknown) => (e as Error)?.name === 'AbortError'

class TimeoutError extends Error {}

/** Overloaded or out of quota for this model: worth trying the next one. */
const shouldFallBack = (e: unknown) =>
  e instanceof TimeoutError || (e instanceof ApiError && [429, 500, 503].includes(e.status))

function fatal(e: unknown): LlmError | null {
  if (e instanceof TimeoutError)
    return new LlmError("Le service d'IA est trop lent, réessayez dans un instant.", 'upstream', 504)
  if (!(e instanceof ApiError)) return null
  if (e.status === 401 || e.status === 403) return new LlmError('Clé API Gemini refusée.', 'auth', 502)
  if (e.status === 429) return new LlmError('Quota gratuit atteint, réessayez plus tard.', 'rate_limited', 429)
  if (e.status === 404) return new LlmError('Modèle Gemini indisponible : vérifiez GEMINI_MODEL.', 'bad_request', 502)
  if (e.status === 400) return new LlmError(`Requête rejetée par l'API : ${e.message}`, 'bad_request', 502)
  return new LlmError("Le service d'IA est surchargé, réessayez dans un instant.", 'upstream', 503)
}

function finishOf(r: GenerateContentResponse | undefined, text: string): JsonResult {
  const reason = r?.candidates?.[0]?.finishReason
  if (r?.promptFeedback?.blockReason || (reason && REFUSALS.has(reason))) return { text, finish: 'refusal' }
  if (reason === FinishReason.MAX_TOKENS) return { text, finish: 'max_tokens' }
  return { text, finish: 'stop' }
}

/** Gemini accepts a subset of JSON Schema and ignores the rest; drop the meta keyword. */
function jsonSchema(output: z.ZodType) {
  const { $schema: _, ...schema } = z.toJSONSchema(output) as Record<string, unknown>
  return schema
}

export function geminiProvider(): Provider {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new LlmError('Clé API absente : renseignez GEMINI_API_KEY dans .env.', 'missing_key', 503)
  const models = [
    process.env.GEMINI_MODEL || 'gemini-3.5-flash-lite',
    ...(process.env.GEMINI_FALLBACK_MODELS ?? 'gemini-3.6-flash,gemini-3.8-flash')
      .split(',')
      .map((m) => m.trim())
      .filter(Boolean),
  ]
  const ai = new GoogleGenAI({ apiKey })
  // free-tier models can queue for minutes when busy: past this, hand over to the next one
  const timeoutMs = Number(process.env.GEMINI_TIMEOUT_MS ?? 90_000)

  const config = (req: JsonRequest, signal: AbortSignal) => ({
    systemInstruction: req.system,
    responseMimeType: 'application/json',
    responseJsonSchema: jsonSchema(req.output),
    maxOutputTokens: req.maxTokens,
    abortSignal: signal,
  })

  /** Runs the call on each model in turn until one is available. */
  async function withFallback(req: JsonRequest, run: (model: string, signal: AbortSignal) => Promise<JsonResult>) {
    for (let i = 0; i < models.length; i++) {
      const controller = new AbortController()
      const cancel = () => controller.abort()
      req.signal?.addEventListener('abort', cancel)
      let timedOut = false
      const timer = setTimeout(() => {
        timedOut = true
        controller.abort()
      }, timeoutMs)
      try {
        return await run(models[i], controller.signal)
      } catch (caught) {
        const e = timedOut ? new TimeoutError(`timeout after ${timeoutMs} ms`) : caught
        if (!timedOut && isAbort(e)) throw e
        if (shouldFallBack(e) && i < models.length - 1) {
          const why = e instanceof ApiError ? e.status : 'timeout'
          console.warn(`[chronos] ${models[i]} unavailable (${why}), trying ${models[i + 1]}`)
          continue
        }
        throw fatal(e) ?? e
      } finally {
        clearTimeout(timer)
        req.signal?.removeEventListener('abort', cancel)
      }
    }
    throw new LlmError("Aucun modèle Gemini n'est disponible.", 'upstream', 503)
  }

  return {
    id: `gemini:${models.join('+')}`,
    generate: (req) =>
      withFallback(req, async (model, signal) => {
        const r = await ai.models.generateContent({ model, contents: req.prompt, config: config(req, signal) })
        return finishOf(r, r.text ?? '')
      }),
    stream: (req) =>
      withFallback(req, async (model, signal) => {
        const chunks = await ai.models.generateContentStream({
          model,
          contents: req.prompt,
          config: config(req, signal),
        })
        let text = ''
        let last: GenerateContentResponse | undefined
        for await (const chunk of chunks) {
          last = chunk
          const delta = chunk.text
          if (delta) {
            text += delta
            req.onText?.(text)
          }
        }
        return finishOf(last, text)
      }),
  }
}
