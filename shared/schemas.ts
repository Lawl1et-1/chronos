import { z } from 'zod'

export const ZoneSchema = z.object({
  name: z.string().min(1).max(120),
  /** ISO 3166-1 numeric code when known. */
  iso: z.string().max(3).nullable(),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
})
export type Zone = z.infer<typeof ZoneSchema>

/** Language the AI writes in (the interface language). */
export const LangSchema = z.enum(['fr', 'en'])
export type ContentLang = z.infer<typeof LangSchema>

export const KeyEventsRequestSchema = z.object({
  zone: ZoneSchema,
  year: z.number().int().min(-3000).max(2020),
  lang: LangSchema.default('fr'),
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

// ---------------------------------------------------------------------------
// Call 2: alternate history

export const AlterationSchema = z.object({
  title: z.string().min(3).max(300),
  description: z.string().max(600),
})
export type Alteration = z.infer<typeof AlterationSchema>

export const AlternateRequestSchema = z.object({
  zone: ZoneSchema,
  year: z.number().int().min(-3000).max(2020),
  lang: LangSchema.default('fr'),
  event: z.object({
    id: z.string().max(80),
    title: z.string().max(200),
    date: z.string().max(80),
    year: z.number().int(),
    summary: z.string().max(800),
  }),
  alteration: AlterationSchema,
  /**
   * For a sub-branch: the alternate timelines it grows from, oldest first, each cut
   * at the milestone where the next branch forks.
   */
  history: z
    .array(
      z.object({
        alteration: z.string().max(300),
        milestones: z.array(z.object({ year: z.number().int(), title: z.string().max(200) })).max(12),
      }),
    )
    .max(4)
    .optional(),
})
export type AlternateRequest = z.infer<typeof AlternateRequestSchema>

const Region = z.object({
  name: z.string(),
  iso: z.string().nullable().describe('Code ISO 3166-1 numérique à 3 chiffres du pays actuel, ou null'),
})

const TimelineNode = z.object({
  year: z.number().int(),
  title: z.string(),
  description: z.string(),
  realHistoryComparison: z.string(),
  confidence: z.number().describe('Confiance entre 0 et 1, décroissante avec le temps'),
  affectedRegions: z.array(Region),
})

const ImpactDimensions = z.object({
  politics: z.number().int(),
  economy: z.number().int(),
  society: z.number().int(),
  culture: z.number().int(),
  geopolitics: z.number().int(),
})

/** How much the change alters the world, as judged by the model. */
const Impact = z.object({
  score: z.number().int().describe("0 à 100 : écart entre le monde de 2025 de cette chronologie et le monde réel"),
  verdict: z.string().describe('2 à 4 mots'),
  summary: z.string(),
  dimensions: ImpactDimensions.describe('Ampleur du changement par domaine, de 0 à 10'),
})

export const ImpactSchema = Impact.extend({
  score: z.number().int().min(0).max(100),
  verdict: z.string().min(2).max(60),
  summary: z.string().min(10).max(500),
  dimensions: z.object({
    politics: z.number().int().min(0).max(10),
    economy: z.number().int().min(0).max(10),
    society: z.number().int().min(0).max(10),
    culture: z.number().int().min(0).max(10),
    geopolitics: z.number().int().min(0).max(10),
  }),
})
export type Impact = z.infer<typeof ImpactSchema>

/** Field order matters: the model writes them in this order, so the timeline streams before the epilogue. */
export const AlternateOutputSchema = z.object({
  divergencePoint: z.object({ year: z.number().int(), title: z.string(), description: z.string() }),
  butterflyEffects: z.array(z.object({ cause: z.string(), effect: z.string() })).describe('3 à 6 maillons'),
  timeline: z.array(TimelineNode).describe('8 à 12 jalons, par ordre chronologique'),
  worldIn2025: z.string(),
  plausibilityNote: z.string(),
  impact: Impact,
})

export const TimelineNodeSchema = TimelineNode.extend({
  title: z.string().min(3).max(140),
  confidence: z.number().min(0).max(1),
  affectedRegions: z.array(Region.extend({ iso: z.string().regex(/^\d{3}$/).nullable() })).max(12),
})
export type TimelineNode = z.infer<typeof TimelineNodeSchema>

export const AlternateResultSchema = AlternateOutputSchema.extend({
  butterflyEffects: z.array(z.object({ cause: z.string(), effect: z.string() })).min(3).max(6),
  timeline: z
    .array(TimelineNodeSchema)
    .min(8)
    .max(12)
    .refine((t) => t.every((n, i) => i === 0 || n.year >= t[i - 1].year), 'Les jalons doivent être chronologiques')
    .refine((t) => t[t.length - 1].year <= 2025, 'Aucun jalon après 2025')
    .refine((t) => t[t.length - 1].confidence <= t[0].confidence, 'La confiance doit baisser avec le temps'),
  impact: ImpactSchema,
})
export type AlternateResult = z.infer<typeof AlternateResultSchema>

export const AlternateResponseSchema = AlternateResultSchema.extend({
  demo: z.boolean(),
  impact: ImpactSchema.optional(),
})
export type AlternateResponse = z.infer<typeof AlternateResponseSchema>

/** What the server streams while the model is still writing. */
export const AlternatePartialSchema = z.object({
  divergencePoint: AlternateOutputSchema.shape.divergencePoint.optional(),
  butterflyEffects: z.array(z.object({ cause: z.string(), effect: z.string() })).optional(),
  timeline: z.array(TimelineNodeSchema),
})
export type AlternatePartial = z.infer<typeof AlternatePartialSchema>

// ---------------------------------------------------------------------------
// Shared links

export const SharedBranchSchema = z.object({
  id: z.string().regex(/^b\d+(\.\d+){0,4}$/),
  parentId: z.string().max(40).nullable(),
  forkNode: z.number().int().min(0).nullable(),
  event: AlternateRequestSchema.shape.event,
  alteration: AlterationSchema,
  data: AlternateResponseSchema,
})
export type SharedBranch = z.infer<typeof SharedBranchSchema>

export const SharePayloadSchema = z.object({
  version: z.literal(1),
  zone: ZoneSchema,
  year: z.number().int(),
  keyEvents: KeyEventsResponseSchema,
  selectedEvent: z.string().max(80),
  branches: z.array(SharedBranchSchema).min(1).max(20),
  activeBranch: z.string().max(40),
})
export type SharePayload = z.infer<typeof SharePayloadSchema>

export const ShareCreatedSchema = z.object({ id: z.string() })

export const ApiErrorSchema = z.object({ error: z.string(), code: z.string() })
export type ApiError = z.infer<typeof ApiErrorSchema>
