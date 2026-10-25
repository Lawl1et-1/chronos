import type { ContentLang } from '../schemas'

/** Final instruction fixing the language of every text field. */
export function languageLine(lang: ContentLang) {
  return lang === 'en'
    ? 'Langue de la réponse : anglais. Rédige tous les textes en anglais (English), y compris les titres, les dates et les noms de lieux usuels.'
    : 'Langue de la réponse : français.'
}
