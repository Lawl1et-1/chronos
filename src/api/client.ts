import type { z } from 'zod'
import {
  ApiErrorSchema,
  KeyEventsResponseSchema,
  type KeyEventsRequest,
  type KeyEventsResponse,
} from '../../shared/schemas'

const CACHE_PREFIX = 'chronos:v1:'

export class ApiRequestError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message)
  }
}

function readCache<S extends z.ZodType>(key: string, schema: S): z.infer<S> | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key)
    if (!raw) return null
    const parsed = schema.safeParse(JSON.parse(raw))
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

function writeCache(key: string, value: unknown) {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(value))
  } catch {
    // storage full or unavailable: caching is best-effort
  }
}

async function postJson<S extends z.ZodType>(url: string, body: unknown, schema: S, signal?: AbortSignal) {
  let res: Response
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiRequestError('Serveur injoignable. Le serveur API est-il lancé ?', 'network')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = ApiErrorSchema.safeParse(json)
    throw new ApiRequestError(err.success ? err.data.error : `Erreur ${res.status}`, err.success ? err.data.code : 'http')
  }
  const parsed = schema.safeParse(json)
  if (!parsed.success) throw new ApiRequestError('Réponse du serveur inattendue.', 'invalid_response')
  return parsed.data as z.infer<S>
}

export async function fetchKeyEvents(req: KeyEventsRequest, signal?: AbortSignal): Promise<KeyEventsResponse> {
  const key = `key-events:${req.zone.iso ?? req.zone.name}:${req.year}`
  const cached = readCache(key, KeyEventsResponseSchema)
  if (cached) return cached
  const data = await postJson('/api/key-events', req, KeyEventsResponseSchema, signal)
  // demo data is not worth keeping: it would mask real results later
  if (!data.demo) writeCache(key, data)
  return data
}
