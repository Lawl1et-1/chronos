import type { Request, Response } from 'express'
import { partialParse } from '@anthropic-ai/sdk/_vendor/partial-json-parser/parser'
import { z } from 'zod'
import {
  AlternateOutputSchema,
  AlternateRequestSchema,
  AlternateResultSchema,
  TimelineNodeSchema,
  type AlternatePartial,
  type AlternateResponse,
} from '../../shared/schemas'
import { ResultCache } from '../cache'
import { LlmError, streamStructured } from '../llm'
import { DEMO_ALTERNATE, DEMO_SUB_BRANCH } from '../mock/alternateHistory'
import { ALTERNATE_SYSTEM, alternatePrompt } from '../prompts/alternateHistory'

const cache = new ResultCache<AlternateResponse>(100)

type Send = (event: 'partial' | 'reset' | 'result' | 'error', data: unknown) => void

const sleep = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      clearTimeout(t)
      reject(new Error('aborted'))
    })
  })

/**
 * Keeps only the parts of the half-written JSON that are complete: an item counts
 * as finished once the model has moved on to the next one (or the next field).
 */
export function completedParts(text: string): AlternatePartial | null {
  let raw: Record<string, unknown>
  try {
    raw = partialParse(text) as Record<string, unknown>
  } catch {
    return null
  }
  if (!raw || typeof raw !== 'object') return null
  const finished = <T>(items: unknown, closed: boolean) =>
    Array.isArray(items) ? ((closed ? items : items.slice(0, -1)) as T[]) : []

  const divergence = AlternateOutputSchema.shape.divergencePoint.safeParse(raw.divergencePoint)
  const effects = finished<{ cause: string; effect: string }>(raw.butterflyEffects, 'timeline' in raw)
  const timeline = finished<unknown>(raw.timeline, 'worldIn2025' in raw)
    .map((n) => TimelineNodeSchema.safeParse(n))
    .filter((r) => r.success)
    .map((r) => r.data)
  return {
    divergencePoint: divergence.success && 'butterflyEffects' in raw ? divergence.data : undefined,
    butterflyEffects: effects.length ? effects : undefined,
    timeline,
  }
}

/** Replays the demo scenario with delays, so the streaming UI can be tried without a key. */
async function streamDemo(send: Send, signal: AbortSignal, demo: AlternateResponse) {
  const { divergencePoint, butterflyEffects, timeline } = demo
  await sleep(900, signal)
  send('partial', { divergencePoint, timeline: [] })
  await sleep(900, signal)
  send('partial', { divergencePoint, butterflyEffects, timeline: [] })
  for (let i = 1; i <= timeline.length; i++) {
    await sleep(650, signal)
    send('partial', { divergencePoint, butterflyEffects, timeline: timeline.slice(0, i) })
  }
  await sleep(500, signal)
  send('result', demo)
}

export async function alternateHistoryRoute(req: Request, res: Response) {
  const parsed = AlternateRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error), code: 'invalid_request' })
    return
  }
  const input = parsed.data

  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
  })
  const send: Send = (event, data) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
  const controller = new AbortController()
  res.on('close', () => controller.abort())

  try {
    if (process.env.CHRONOS_MOCK === '1') {
      await streamDemo(send, controller.signal, input.history?.length ? DEMO_SUB_BRANCH : DEMO_ALTERNATE)
      return
    }

    const key = [
      process.env.ANTHROPIC_MODEL,
      input.zone.iso ?? input.zone.name,
      input.year,
      input.event.id,
      input.alteration.title.trim().toLowerCase(),
      input.alteration.description.trim().toLowerCase(),
      JSON.stringify(input.history ?? []),
    ].join('|')
    const cached = cache.peek(key)
    if (cached) {
      send('result', cached)
      return
    }

    let signature = ''
    const started = Date.now()
    const data = await streamStructured({
      system: ALTERNATE_SYSTEM,
      prompt: alternatePrompt(input),
      output: AlternateOutputSchema,
      validate: AlternateResultSchema,
      signal: controller.signal,
      onText: (snapshot) => {
        const partial = completedParts(snapshot)
        if (!partial) return
        const next = `${partial.divergencePoint ? 1 : 0}|${partial.butterflyEffects?.length ?? 0}|${partial.timeline.length}`
        if (next === signature) return
        signature = next
        send('partial', partial)
      },
      onRetry: () => {
        signature = ''
        send('reset', {})
      },
    })
    console.log(`[chronos] alternate history for "${input.alteration.title}" in ${Date.now() - started} ms`)
    const response: AlternateResponse = { ...data, demo: false }
    cache.set(key, response)
    send('result', response)
  } catch (error) {
    if (controller.signal.aborted) return
    if (error instanceof LlmError) send('error', { error: error.message, code: error.code })
    else {
      console.error(error)
      send('error', { error: 'Erreur interne du serveur.', code: 'internal' })
    }
  } finally {
    res.end()
  }
}
