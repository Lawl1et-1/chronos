import { z } from 'zod'
import { LlmError, type JsonResult, type Provider } from './types'

interface StructuredRequest<Out extends z.ZodType, Full extends z.ZodType> {
  system: string
  prompt: string
  /** Schema the model is constrained to (types only). */
  output: Out
  /** Stricter schema the parsed output must pass; failures are sent back for a retry. */
  validate: Full
  maxTokens?: number
  attempts?: number
  signal?: AbortSignal
}

interface StreamRequest<Out extends z.ZodType, Full extends z.ZodType> extends StructuredRequest<Out, Full> {
  /** Called with the JSON text written so far. */
  onText: (snapshot: string) => void
  /** Called before a retry, so the consumer can drop what it already showed. */
  onRetry: () => void
}

function withFeedback(prompt: string, feedback: string) {
  return feedback
    ? `${prompt}\n\nTa réponse précédente était invalide :\n${feedback}\nRenvoie une réponse complète qui corrige ces points.`
    : prompt
}

/**
 * Shared validation loop: invalid, unparseable or truncated output is retried with the
 * problem appended to the prompt, up to `attempts` times.
 */
async function validated<Full extends z.ZodType>(
  attempts: number,
  validate: Full,
  call: (prompt: string, attempt: number) => Promise<JsonResult>,
  prompt: string,
  signal?: AbortSignal,
): Promise<z.infer<Full>> {
  let feedback = ''
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const { text, finish } = await call(withFeedback(prompt, feedback), attempt)
      if (finish === 'refusal') throw new LlmError('Le modèle a refusé de traiter cette demande.', 'refusal', 422)
      if (finish === 'max_tokens') {
        feedback = '- la réponse a été tronquée : sois plus concis.'
        continue
      }
      let json: unknown
      try {
        json = JSON.parse(text)
      } catch (error) {
        feedback = `- JSON illisible : ${(error as Error).message}`
        continue
      }
      const checked = validate.safeParse(json)
      if (checked.success) return checked.data
      feedback = z.prettifyError(checked.error).slice(0, 2000)
      console.warn(`[chronos] invalid output (attempt ${attempt}/${attempts})\n${feedback}`)
    } catch (error) {
      if (error instanceof LlmError || signal?.aborted) throw error
      feedback = `- erreur : ${(error as Error).message}`
      console.warn(`[chronos] failed attempt ${attempt}/${attempts}: ${(error as Error).message}`)
    }
  }
  throw new LlmError("Réponse invalide de l'IA après plusieurs essais.", 'invalid_output', 502)
}

/** One structured call, validated and retried. */
export function generateStructured<Out extends z.ZodType, Full extends z.ZodType>(
  provider: Provider,
  { system, prompt, output, validate, signal, maxTokens = 16000, attempts = 3 }: StructuredRequest<Out, Full>,
): Promise<z.infer<Full>> {
  return validated(
    attempts,
    validate,
    (p) => provider.generate({ system, prompt: p, output, maxTokens, signal }),
    prompt,
    signal,
  )
}

/** Streaming variant: same validation and retries, with the JSON text as it is written. */
export function streamStructured<Out extends z.ZodType, Full extends z.ZodType>(
  provider: Provider,
  { system, prompt, output, validate, onText, onRetry, signal, maxTokens = 32000, attempts = 3 }: StreamRequest<Out, Full>,
): Promise<z.infer<Full>> {
  return validated(
    attempts,
    validate,
    (p, attempt) => {
      if (attempt > 1) onRetry()
      return provider.stream({ system, prompt: p, output, maxTokens, signal, onText })
    },
    prompt,
    signal,
  )
}
