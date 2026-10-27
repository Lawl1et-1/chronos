/**
 * AI proxy for the static site: forwards generation calls to Gemini with the key kept
 * as a Worker secret, so visitors never need one. Only the site's origin, the allowed
 * models and the two generation methods are accepted.
 */

interface Env {
  GEMINI_API_KEY: string
  /** Comma-separated origins allowed to call the proxy. */
  ALLOWED_ORIGINS: string
  /** Comma-separated model ids that may be requested. */
  ALLOWED_MODELS: string
}

const UPSTREAM = 'https://generativelanguage.googleapis.com'
const MAX_BODY = 64 * 1024
const PATH = /^\/v1beta\/models\/([a-z0-9.-]+):(generateContent|streamGenerateContent)$/

function cors(origin: string) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, x-goog-api-key, x-goog-api-client',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}

const deny = (status: number, message: string, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify({ error: { code: status, message } }), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    if (!allowed.includes(origin)) return deny(403, 'Origin not allowed')
    const headers = cors(origin)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return deny(405, 'Method not allowed', headers)

    const url = new URL(request.url)
    const match = PATH.exec(url.pathname)
    const models = env.ALLOWED_MODELS.split(',').map((m) => m.trim())
    if (!match || !models.includes(match[1])) return deny(404, 'Not found', headers)

    const body = await request.arrayBuffer()
    if (body.byteLength > MAX_BODY) return deny(413, 'Request too large', headers)

    // only the streaming mode parameter is forwarded; the key comes from the secret
    const upstream = new URL(UPSTREAM + url.pathname)
    if (url.searchParams.get('alt') === 'sse') upstream.searchParams.set('alt', 'sse')

    const response = await fetch(upstream, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
      body,
    })
    const out = new Headers(headers)
    out.set('Content-Type', response.headers.get('Content-Type') ?? 'application/json')
    return new Response(response.body, { status: response.status, headers: out })
  },
}
