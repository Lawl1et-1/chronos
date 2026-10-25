import type { z } from 'zod'
import {
  AlternatePartialSchema,
  AlternateResponseSchema,
  ApiErrorSchema,
  KeyEventsResponseSchema,
  ShareCreatedSchema,
  SharePayloadSchema,
  type AlternatePartial,
  type AlternateRequest,
  type AlternateResponse,
  type KeyEventsRequest,
  type KeyEventsResponse,
  type SharePayload,
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

interface StreamHandlers {
  onPartial: (partial: AlternatePartial) => void
  /** The server is retrying after an invalid answer: drop what was shown. */
  onReset: () => void
  signal?: AbortSignal
}

/** Reads the server-sent events of /api/alternate-history until the final result. */
export async function streamAlternateHistory(
  req: AlternateRequest,
  { onPartial, onReset, signal }: StreamHandlers,
): Promise<AlternateResponse> {
  const key = [
    'alternate',
    req.zone.iso ?? req.zone.name,
    req.year,
    req.event.id,
    req.alteration.title.trim().toLowerCase(),
    req.alteration.description.trim().toLowerCase(),
    JSON.stringify(req.history ?? []),
  ].join(':')
  const cached = readCache(key, AlternateResponseSchema)
  if (cached) return cached

  let res: Response
  try {
    res = await fetch('/api/alternate-history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify(req),
      signal,
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiRequestError('Serveur injoignable. Le serveur API est-il lancé ?', 'network')
  }
  if (!res.ok || !res.body) {
    const err = ApiErrorSchema.safeParse(await res.json().catch(() => null))
    throw new ApiRequestError(err.success ? err.data.error : `Erreur ${res.status}`, err.success ? err.data.code : 'http')
  }

  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader()
  let buffer = ''
  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += value
    let boundary: number
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const block = buffer.slice(0, boundary)
      buffer = buffer.slice(boundary + 2)
      const event = /^event: (.+)$/m.exec(block)?.[1]
      const data = /^data: (.*)$/m.exec(block)?.[1]
      if (!event || data === undefined) continue
      const json = JSON.parse(data)
      if (event === 'partial') {
        const partial = AlternatePartialSchema.safeParse(json)
        if (partial.success) onPartial(partial.data)
      } else if (event === 'reset') {
        onReset()
      } else if (event === 'error') {
        const err = ApiErrorSchema.safeParse(json)
        throw new ApiRequestError(err.success ? err.data.error : 'Erreur du serveur.', err.success ? err.data.code : 'http')
      } else if (event === 'result') {
        const result = AlternateResponseSchema.safeParse(json)
        if (!result.success) throw new ApiRequestError('Réponse du serveur inattendue.', 'invalid_response')
        if (!result.data.demo) writeCache(key, result.data)
        return result.data
      }
    }
  }
  throw new ApiRequestError('La connexion a été interrompue avant la fin.', 'interrupted')
}

/** Stores a finished scenario on the server and returns its short id. */
export async function createShare(payload: SharePayload): Promise<string> {
  const { id } = await postJson('/api/share', payload, ShareCreatedSchema)
  return id
}

export async function fetchShare(id: string): Promise<SharePayload> {
  let res: Response
  try {
    res = await fetch(`/api/share/${encodeURIComponent(id)}`)
  } catch {
    throw new ApiRequestError('Serveur injoignable.', 'network')
  }
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    const err = ApiErrorSchema.safeParse(json)
    throw new ApiRequestError(err.success ? err.data.error : `Erreur ${res.status}`, err.success ? err.data.code : 'http')
  }
  const parsed = SharePayloadSchema.safeParse(json)
  if (!parsed.success) throw new ApiRequestError('Lien de partage invalide.', 'invalid_response')
  return parsed.data
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
