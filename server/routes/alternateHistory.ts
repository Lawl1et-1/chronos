import type { Request, Response } from 'express'
import { z } from 'zod'
import {
  AlternateOutputSchema,
  AlternateRequestSchema,
  AlternateResultSchema,
  type AlternateResponse,
} from '../../shared/schemas'
import { completedParts, partialSignature } from '../../shared/partial'
import { ResultCache } from '../cache'
import { LlmError, providerId, streamStructured } from '../llm'
import { demoAlternate } from '../../shared/demo'
import { ALTERNATE_SYSTEM, alternatePrompt } from '../../shared/prompts/alternateHistory'

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
      await streamDemo(send, controller.signal, demoAlternate(input.lang, !!input.history?.length))
      return
    }

    const key = [
      providerId(),
      input.zone.iso ?? input.zone.name,
      input.year,
      input.lang,
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
        const next = partialSignature(partial)
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
