import type { Request, Response } from 'express'
import { z } from 'zod'
import {
  KeyEventsOutputSchema,
  KeyEventsRequestSchema,
  KeyEventsResultSchema,
  type KeyEventsResponse,
} from '../../shared/schemas'
import { ResultCache } from '../cache'
import { generateStructured, LlmError, providerId } from '../llm'
import { DEMO_KEY_EVENTS } from '../../shared/demo/keyEvents'
import { KEY_EVENTS_SYSTEM, keyEventsPrompt } from '../../shared/prompts/keyEvents'

const cache = new ResultCache<KeyEventsResponse>()

export async function keyEventsRoute(req: Request, res: Response) {
  const parsed = KeyEventsRequestSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error), code: 'invalid_request' })
    return
  }
  const input = parsed.data

  if (process.env.CHRONOS_MOCK === '1') {
    res.json(DEMO_KEY_EVENTS)
    return
  }

  const key = `${providerId()}|${input.zone.iso ?? input.zone.name}|${input.year}`
  try {
    const result = await cache.get(key, async () => {
      const started = Date.now()
      const data = await generateStructured({
        system: KEY_EVENTS_SYSTEM,
        prompt: keyEventsPrompt(input),
        output: KeyEventsOutputSchema,
        validate: KeyEventsResultSchema,
      })
      console.log(`[chronos] key events for ${input.zone.name} ${input.year} in ${Date.now() - started} ms`)
      return { ...data, zone: input.zone, year: input.year, demo: false }
    })
    res.json(result)
  } catch (error) {
    if (error instanceof LlmError) {
      res.status(error.status).json({ error: error.message, code: error.code })
      return
    }
    console.error(error)
    res.status(500).json({ error: 'Erreur interne du serveur.', code: 'internal' })
  }
}
