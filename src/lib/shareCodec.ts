import { SharePayloadSchema, type SharePayload } from '../../shared/schemas'

/**
 * Without a server (static site), a shared scenario travels inside the link itself:
 * JSON, deflate-compressed, then base64url in the URL hash (never sent to any server).
 */

async function pipe(bytes: Uint8Array<ArrayBuffer>, stream: CompressionStream | DecompressionStream) {
  const out = new Blob([bytes]).stream().pipeThrough(stream)
  return new Uint8Array(await new Response(out).arrayBuffer())
}

function toBase64Url(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(text: string) {
  const bin = atob(text.replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

export async function encodeShare(payload: SharePayload) {
  const json = new TextEncoder().encode(JSON.stringify(payload))
  return toBase64Url(await pipe(json, new CompressionStream('deflate-raw')))
}

export async function decodeShare(encoded: string): Promise<SharePayload> {
  try {
    const json = new TextDecoder().decode(await pipe(fromBase64Url(encoded), new DecompressionStream('deflate-raw')))
    return SharePayloadSchema.parse(JSON.parse(json))
  } catch {
    throw new Error('Lien de partage invalide ou incomplet.')
  }
}
