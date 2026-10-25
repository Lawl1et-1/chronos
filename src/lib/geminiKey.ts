/** The visitor's own Gemini key on the static site: kept in this browser only. */
const KEY_STORAGE = 'chronos:gemini-key'

export function readGeminiKey() {
  try {
    return localStorage.getItem(KEY_STORAGE)
  } catch {
    return null
  }
}

export function writeGeminiKey(key: string | null) {
  try {
    if (key) localStorage.setItem(KEY_STORAGE, key)
    else localStorage.removeItem(KEY_STORAGE)
  } catch {
    // storage unavailable: the key only lives for this visit
  }
}
