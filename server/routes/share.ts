import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import type { Request, Response } from 'express'
import { z } from 'zod'
import { SharePayloadSchema } from '../../shared/schemas'

/** Shared scenarios are plain JSON files, one per link (directory ignored by git). */
const DIR = resolve(process.env.CHRONOS_SHARE_DIR ?? 'data/shares')
const ID = /^[A-Za-z0-9_-]{10}$/

const newId = () => randomBytes(8).toString('base64url').slice(0, 10)

export async function createShareRoute(req: Request, res: Response) {
  const parsed = SharePayloadSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: z.prettifyError(parsed.error), code: 'invalid_request' })
    return
  }
  try {
    await mkdir(DIR, { recursive: true })
    const id = newId()
    await writeFile(resolve(DIR, `${id}.json`), JSON.stringify(parsed.data), { flag: 'wx' })
    res.status(201).json({ id })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: "Impossible d'enregistrer le lien.", code: 'internal' })
  }
}

export async function readShareRoute(req: Request, res: Response) {
  const id = String(req.params.id)
  if (!ID.test(id)) {
    res.status(400).json({ error: 'Identifiant de partage invalide.', code: 'invalid_request' })
    return
  }
  try {
    const raw = await readFile(resolve(DIR, `${id}.json`), 'utf8')
    const parsed = SharePayloadSchema.safeParse(JSON.parse(raw))
    if (!parsed.success) throw new Error('corrupted share')
    res.json(parsed.data)
  } catch {
    res.status(404).json({ error: "Ce lien de partage n'existe pas ou a expiré.", code: 'not_found' })
  }
}
