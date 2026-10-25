import { z } from 'zod'

export const ZoneSchema = z.object({
  name: z.string().min(1).max(120),
  /** ISO 3166-1 numeric code when known. */
  iso: z.string().max(3).nullable(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
})
export type Zone = z.infer<typeof ZoneSchema>

export const KeyEventsRequestSchema = z.object({
  zone: ZoneSchema,
  year: z.number().int().min(-3000).max(2020),
})
export type KeyEventsRequest = z.infer<typeof KeyEventsRequestSchema>

const Alteration = z.object({
  title: z.string(),
  description: z.string(),
})

const KeyEvent = z.object({
  id: z.string(),
  title: z.string(),
  date: z.string(),
  year: z.number().int(),
  summary: z.string(),
  whyItMattered: z.string(),
  longTermImpact: z.string(),
  impactScore: z.number().int().describe('Impact historique, entier de 1 à 10'),
  coordinates: z.object({ lat: z.number(), lon: z.number() }),
  possibleAlterations: z.array(Alteration).describe('Exactement 3 modifications plausibles'),
})

/**
 * Shape sent to the model as a structured-output schema: types only, since
 * numeric bounds and array lengths are checked separately below.
 */
export const KeyEventsOutputSchema = z.object({
  period: z.object({ label: z.string(), start: z.number().int(), end: z.number().int() }),
  context: z.string(),
  events: z.array(KeyEvent).describe('Exactement 5 événements, par ordre chronologique'),
})

/** Full validation, applied to every model response (and to cached client data). */
export const KeyEventsResultSchema = KeyEventsOutputSchema.extend({
  events: z
    .array(
      KeyEvent.extend({
        id: z.string().regex(/^[a-z0-9-]{2,60}$/),
        title: z.string().min(3).max(120),
        summary: z.string().min(20).max(600),
        impactScore: z.number().int().min(1).max(10),
        coordinates: z.object({ lat: z.number().min(-90).max(90), lon: z.number().min(-180).max(180) }),
        possibleAlterations: z.array(Alteration.extend({ title: z.string().min(3).max(140) })).length(3),
      }),
    )
    .length(5)
    .refine((events) => new Set(events.map((e) => e.id)).size === events.length, 'Les identifiants doivent être uniques'),
})
export type KeyEventsResult = z.infer<typeof KeyEventsResultSchema>
export type KeyEvent = KeyEventsResult['events'][number]

export const KeyEventsResponseSchema = KeyEventsResultSchema.extend({
  zone: ZoneSchema,
  year: z.number().int(),
  /** True when served from the built-in demo data instead of the model. */
  demo: z.boolean(),
})
export type KeyEventsResponse = z.infer<typeof KeyEventsResponseSchema>

export const ApiErrorSchema = z.object({ error: z.string(), code: z.string() })
export type ApiError = z.infer<typeof ApiErrorSchema>
