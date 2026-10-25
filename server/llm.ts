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
  const { client, model, effort, fallbacks } = llmConfig()
  let feedback = ''

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const content = feedback
      ? `${prompt}\n\nTa réponse précédente était invalide :\n${feedback}\nRenvoie une réponse complète qui corrige ces points.`
      : prompt
    try {
      const response = await client.beta.messages.parse({
        model,
        max_tokens: maxTokens,
        system,
        messages: [{ role: 'user', content }],
        output_config: {
          ...(effort ? { effort: effort as 'low' | 'medium' | 'high' | 'xhigh' | 'max' } : {}),
          format: betaZodOutputFormat(output),
        },
        // on a policy decline, let the API retry on a fallback model in the same call
        ...(fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
      })

      if (response.stop_reason === 'refusal') {
        throw new LlmError('Le modèle a refusé de traiter cette demande.', 'refusal', 422)
      }
      if (response.stop_reason === 'max_tokens') {
        feedback = '- la réponse a été tronquée : sois plus concis.'
        continue
      }
      const checked = validate.safeParse(response.parsed_output)
      if (checked.success) return checked.data
      feedback = z.prettifyError(checked.error).slice(0, 2000)
      console.warn(`[chronos] invalid output (attempt ${attempt}/${attempts})\n${feedback}`)
    } catch (error) {
      if (error instanceof LlmError) throw error
      if (error instanceof Anthropic.AuthenticationError) {
        throw new LlmError('Clé API refusée par le fournisseur.', 'auth', 502)
      }
      if (error instanceof Anthropic.RateLimitError) {
        throw new LlmError('Limite de requêtes atteinte, réessayez dans un instant.', 'rate_limited', 429)
      }
      if (error instanceof Anthropic.BadRequestError) {
        throw new LlmError(`Requête rejetée par l'API : ${error.message}`, 'bad_request', 502)
      }
      if (error instanceof Anthropic.APIError) {
        throw new LlmError("Le service d'IA ne répond pas correctement.", 'upstream', 502)
      }
      // JSON that could not be parsed at all: retry like any other invalid output
      feedback = `- JSON illisible : ${(error as Error).message}`
      console.warn(`[chronos] unparseable output (attempt ${attempt}/${attempts})`)
    }
  }
  throw new LlmError("Réponse invalide de l'IA après plusieurs essais.", 'invalid_output', 502)
}
