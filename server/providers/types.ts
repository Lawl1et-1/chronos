import type { z } from 'zod'

export class LlmError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message)
  }
}

export interface JsonRequest {
  system: string
  prompt: string
  /** Shape the model must follow; each provider turns it into its own schema format. */
  output: z.ZodType
  maxTokens: number
  signal?: AbortSignal
  /** Streaming only: called with all the JSON text written so far. */
  onText?: (snapshot: string) => void
}

export interface JsonResult {
  text: string
  finish: 'stop' | 'max_tokens' | 'refusal'
}

/**
 * A model provider. Fatal problems (bad key, quota…) are thrown as LlmError; any other
 * error is treated as a bad answer and retried by the caller.
 */
export interface Provider {
  /** Identifies provider and model, e.g. for cache keys. */
  id: string
  generate: (req: JsonRequest) => Promise<JsonResult>
  stream: (req: JsonRequest) => Promise<JsonResult>
}
