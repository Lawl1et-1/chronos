import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import express from 'express'
import { providerId } from './llm'
import { keyEventsRoute } from './routes/keyEvents'
import { alternateHistoryRoute } from './routes/alternateHistory'
import { createShareRoute, readShareRoute } from './routes/share'

try {
  process.loadEnvFile()
} catch {
  // no .env file — rely on the environment
}

const app = express()
// shared scenarios carry whole timelines: they get a larger body limit than the rest
app.post('/api/share', express.json({ limit: '1mb' }), createShareRoute)
app.get('/api/share/:id', readShareRoute)
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    provider: providerId(),
    demo: process.env.CHRONOS_MOCK === '1',
  })
})

app.post('/api/key-events', keyEventsRoute)
app.post('/api/alternate-history', alternateHistoryRoute)

// `npm start`: serve the production build from the same server
const dist = resolve('dist')
if (process.argv.includes('--static') && existsSync(dist)) {
  app.use(express.static(dist, { maxAge: '7d', index: false }))
  app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(resolve(dist, 'index.html')))
}

const port = Number(process.env.API_PORT ?? 8787)
app.listen(port, () => console.log(`[chronos] api listening on http://localhost:${port}`))
