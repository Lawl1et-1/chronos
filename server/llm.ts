import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { z } from 'zod'

export class LlmError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
  }
}

let client: Anthropic | null = null

export function llmConfig() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL
  if (!apiKey) throw new LlmError('Clé API absente : renseignez ANTHROPIC_API_KEY dans .env.', 'missing_key', 503)
  if (!model) throw new LlmError('Modèle absent : renseignez ANTHROPIC_MODEL dans .env.', 'missing_model', 503)
  client ??= new Anthropic({ apiKey })
  const effort = process.env.ANTHROPIC_EFFORT ?? 'medium'
  const fallbacks = process.env.ANTHROPIC_FALLBACKS !== 'off'
  return { client, model, effort, fallbacks }
}

interface StructuredRequest<Out extends z.ZodType, Full extends z.ZodType> {
  system: string
  prompt: string
  /** Schema the model is constrained to (types only). */
  output: Out
  /** Stricter schema the parsed output must pass; failures are sent back for a retry. */
  validate: Full
  maxTokens?: number
  attempts?: number
}

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

function withFeedback(prompt: string, feedback: string) {
  return feedback
    ? `${prompt}\n\nTa réponse précédente était invalide :\n${feedback}\nRenvoie une réponse complète qui corrige ces points.`
    : prompt
}

function requestParams(system: string, content: string, output: z.ZodType, maxTokens: number) {
  const { model, effort, fallbacks } = llmConfig()
  return {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user' as const, content }],
    output_config: {
      ...(effort ? { effort: effort as Effort } : {}),
      format: betaZodOutputFormat(output),
    },
    // on a policy decline, let the API retry on a fallback model in the same call
    ...(fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  }
}

/** Maps SDK errors to user-facing ones; returns null for errors worth a retry. */
function apiError(error: unknown): LlmError | null {
  if (error instanceof LlmError) return error
  if (error instanceof Anthropic.AuthenticationError) {
    return new LlmError('Clé API refusée par le fournisseur.', 'auth', 502)
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new LlmError('Limite de requêtes atteinte, réessayez dans un instant.', 'rate_limited', 429)
  }
  if (error instanceof Anthropic.BadRequestError) {
    return new LlmError(`Requête rejetée par l'API : ${error.message}`, 'bad_request', 502)
  }
  if (error instanceof Anthropic.APIError) {
    return new LlmError("Le service d'IA ne répond pas correctement.", 'upstream', 502)
  }
  return null
}

const refused = () => new LlmError('Le modèle a refusé de traiter cette demande.', 'refusal', 422)
const exhausted = () => new LlmError("Réponse invalide de l'IA après plusieurs essais.", 'invalid_output', 502)
const TRUNCATED = '- la réponse a été tronquée : sois plus concis.'

/**
 * One structured call with validation. Invalid or truncated output is retried with
 * the validation error appended, up to `attempts` times.
 */
export async function generateStructured<Out extends z.ZodType, Full extends z.ZodType>({
  system,
  prompt,
  output,
  validate,
  maxTokens = 16000,
  attempts = 3,
}: StructuredRequest<Out, Full>): Promise<z.infer<Full>> {
  const { client } = llmConfig()
  let feedback = ''

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const response = await client.beta.messages.parse(
        requestParams(system, withFeedback(prompt, feedback), output, maxTokens),
      )
      if (response.stop_reason === 'refusal') throw refused()
      if (response.stop_reason === 'max_tokens') {
        feedback = TRUNCATED
        continue
      }
      const checked = validate.safeParse(response.parsed_output)
      if (checked.success) return checked.data
      feedback = z.prettifyError(checked.error).slice(0, 2000)
      console.warn(`[chronos] invalid output (attempt ${attempt}/${attempts})\n${feedback}`)
    } catch (error) {
      const fatal = apiError(error)
      if (fatal) throw fatal
      // JSON that could not be parsed at all: retry like any other invalid output
      feedback = `- JSON illisible : ${(error as Error).message}`
      console.warn(`[chronos] unparseable output (attempt ${attempt}/${attempts})`)
    }
  }
  throw exhausted()
}

interface StreamRequest<Out extends z.ZodType, Full extends z.ZodType> extends StructuredRequest<Out, Full> {
  /** Called with the JSON text written so far. */
  onText: (snapshot: string) => void
  /** Called before a retry, so the consumer can drop what it already showed. */
  onRetry: () => void
  signal?: AbortSignal
}

/** Streaming variant of generateStructured: same validation and retries, with live text. */
export async function streamStructured<Out extends z.ZodType, Full extends z.ZodType>({
  system,
  prompt,
  output,
  validate,
  onText,
  onRetry,
  signal,
  maxTokens = 32000,
  attempts = 3,
}: StreamRequest<Out, Full>): Promise<z.infer<Full>> {
  const { client } = llmConfig()
  let feedback = ''

  for (let attempt = 1; attempt <= attempts; attempt++) {
    if (attempt > 1) onRetry()
    try {
      const stream = client.beta.messages.stream(
        requestParams(system, withFeedback(prompt, feedback), output, maxTokens),
        { signal },
      )
      stream.on('text', (_delta, snapshot) => onText(snapshot))
      const message = await stream.finalMessage()
      if (message.stop_reason === 'refusal') throw refused()
      if (message.stop_reason === 'max_tokens') {
        feedback = TRUNCATED
        continue
      }
      const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
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
      console.warn(`[chronos] invalid streamed output (attempt ${attempt}/${attempts})\n${feedback}`)
    } catch (error) {
      if (signal?.aborted) throw error
      const fatal = apiError(error)
      if (fatal) throw fatal
      feedback = `- erreur : ${(error as Error).message}`
    }
  }
  throw exhausted()
}
