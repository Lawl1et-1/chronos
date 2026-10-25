import type { z } from 'zod'
import { DEFAULT_GEMINI_MODELS, geminiProvider } from '../shared/llm/gemini'
import * as structured from '../shared/llm/structured'
import { LlmError, type Provider } from '../shared/llm/types'
import { anthropicProvider } from './providers/anthropic'

export { LlmError }

let provider: Provider | null = null

/** The configured provider (LLM_PROVIDER, Gemini by default), created on first use. */
export function llm(): Provider {
  if (provider) return provider
  const name = (process.env.LLM_PROVIDER ?? 'gemini').toLowerCase()
  if (name === 'gemini') {
    if (!process.env.GEMINI_API_KEY) {
      throw new LlmError('Clé API absente : renseignez GEMINI_API_KEY dans .env.', 'missing_key', 503)
    }
    const fallbacks = process.env.GEMINI_FALLBACK_MODELS
    provider = geminiProvider({
      apiKey: process.env.GEMINI_API_KEY,
      models: [
        process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODELS[0],
        ...(fallbacks === undefined ? DEFAULT_GEMINI_MODELS.slice(1) : fallbacks.split(',').map((m) => m.trim())),
      ].filter(Boolean),
      timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS ?? 90_000),
    })
  } else if (name === 'anthropic') provider = anthropicProvider()
  else throw new LlmError(`Fournisseur inconnu : ${name} (gemini ou anthropic).`, 'missing_model', 503)
  return provider
}

/** Provider + model identity for cache keys, or "unconfigured" (never throws). */
export function providerId() {
  try {
    return llm().id
  } catch {
    return 'unconfigured'
  }
}

type GenerateArgs<O extends z.ZodType, F extends z.ZodType> = Parameters<typeof structured.generateStructured<O, F>>[1]
type StreamArgs<O extends z.ZodType, F extends z.ZodType> = Parameters<typeof structured.streamStructured<O, F>>[1]

export const generateStructured = <O extends z.ZodType, F extends z.ZodType>(args: GenerateArgs<O, F>) =>
  structured.generateStructured(llm(), args)

export const streamStructured = <O extends z.ZodType, F extends z.ZodType>(args: StreamArgs<O, F>) =>
  structured.streamStructured(llm(), args)
