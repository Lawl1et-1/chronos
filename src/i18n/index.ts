import { useCallback } from 'react'
import { create } from 'zustand'
import { messages, type MessageKey } from './messages'

export type Lang = 'fr' | 'en'
export type { MessageKey }

const STORAGE = 'chronos:lang'

/** Saved choice first, otherwise the browser's language. */
function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE)
    if (saved === 'fr' || saved === 'en') return saved
  } catch {
    // no storage: fall back to the browser
  }
  return typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('fr') ? 'fr' : 'en'
}

export const useLang = create<{ lang: Lang; setLang: (lang: Lang) => void }>((set) => ({
  lang: initialLang(),
  setLang: (lang) => {
    try {
      localStorage.setItem(STORAGE, lang)
    } catch {
      // the choice only lasts for this visit
    }
    applyToDocument(lang)
    set({ lang })
  },
}))

function applyToDocument(lang: Lang) {
  document.documentElement.lang = lang
  document.title = messages[lang]['meta.title']
}

if (typeof document !== 'undefined') applyToDocument(useLang.getState().lang)

export const getLang = () => useLang.getState().lang

/** Text for a key in the given (or current) language, with `{name}` placeholders filled. */
export function translate(key: MessageKey, vars?: Record<string, string | number>, lang: Lang = getLang()) {
  const text: string = messages[lang][key]
  return vars ? text.replace(/\{(\w+)\}/g, (m, name) => (name in vars ? String(vars[name]) : m)) : text
}

/** `t()` bound to the current language; components using it re-render on a switch. */
export function useT() {
  const lang = useLang((s) => s.lang)
  return useCallback((key: MessageKey, vars?: Record<string, string | number>) => translate(key, vars, lang), [lang])
}

/** Localized message for an API error code, or the given fallback. */
export function errorText(code: string, fallback?: string) {
  const key = `error.${code}` as MessageKey
  return key in messages.fr ? translate(key) : (fallback ?? translate('error.unexpected'))
}
