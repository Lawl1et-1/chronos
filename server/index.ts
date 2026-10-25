import express from 'express'

try {
  process.loadEnvFile()
} catch {
  // no .env file — rely on the environment
}

const app = express()
app.use(express.json({ limit: '100kb' }))

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, model: process.env.ANTHROPIC_MODEL || null, hasKey: Boolean(process.env.ANTHROPIC_API_KEY) })
})

const port = Number(process.env.API_PORT ?? 8787)
app.listen(port, () => console.log(`[chronos] api listening on http://localhost:${port}`))
