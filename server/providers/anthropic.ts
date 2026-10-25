import Anthropic from '@anthropic-ai/sdk'
import { betaZodOutputFormat } from '@anthropic-ai/sdk/helpers/beta/zod'
import { LlmError, type JsonRequest, type JsonResult, type Provider } from './types'

type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max'

function fatal(error: unknown): LlmError | null {
  if (error instanceof Anthropic.AuthenticationError) return new LlmError('Clé API refusée.', 'auth', 502)
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

function finishOf(message: Anthropic.Beta.BetaMessage): JsonResult {
  const text = message.content.map((b) => (b.type === 'text' ? b.text : '')).join('')
  if (message.stop_reason === 'refusal') return { text, finish: 'refusal' }
  if (message.stop_reason === 'max_tokens') return { text, finish: 'max_tokens' }
  return { text, finish: 'stop' }
}

export function anthropicProvider(): Provider {
  const apiKey = process.env.ANTHROPIC_API_KEY
  const model = process.env.ANTHROPIC_MODEL
  if (!apiKey) throw new LlmError('Clé API absente : renseignez ANTHROPIC_API_KEY dans .env.', 'missing_key', 503)
  if (!model) throw new LlmError('Modèle absent : renseignez ANTHROPIC_MODEL dans .env.', 'missing_model', 503)
  const client = new Anthropic({ apiKey })
  const effort = process.env.ANTHROPIC_EFFORT ?? 'medium'
  const fallbacks = process.env.ANTHROPIC_FALLBACKS !== 'off'

  const params = (req: JsonRequest) => ({
    model,
    max_tokens: req.maxTokens,
    system: req.system,
    messages: [{ role: 'user' as const, content: req.prompt }],
    output_config: {
      ...(effort ? { effort: effort as Effort } : {}),
      format: betaZodOutputFormat(req.output),
    },
    // on a policy decline, let the API retry on a fallback model in the same call
    ...(fallbacks ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
  })

  const guard = async (run: () => Promise<JsonResult>) => {
    try {
      return await run()
    } catch (error) {
      throw fatal(error) ?? error
    }
  }

  return {
    id: `anthropic:${model}`,
    generate: (req) => guard(async () => finishOf(await client.beta.messages.create(params(req)))),
    stream: (req) =>
      guard(async () => {
        const stream = client.beta.messages.stream(params(req), { signal: req.signal })
        stream.on('text', (_delta, snapshot) => req.onText?.(snapshot))
        return finishOf(await stream.finalMessage())
      }),
  }
}
