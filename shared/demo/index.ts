import type { ContentLang } from '../schemas'
import { DEMO_ALTERNATE, DEMO_SUB_BRANCH } from './alternateHistory'
import { DEMO_ALTERNATE_EN, DEMO_KEY_EVENTS_EN, DEMO_SUB_BRANCH_EN } from './en'
import { DEMO_KEY_EVENTS } from './keyEvents'

/** Demo data in the requested language. */
export const demoKeyEvents = (lang: ContentLang) => (lang === 'en' ? DEMO_KEY_EVENTS_EN : DEMO_KEY_EVENTS)

/** The root demo branch, or the demo sub-branch when forking from a milestone. */
export function demoAlternate(lang: ContentLang, subBranch: boolean) {
  if (lang === 'en') return subBranch ? DEMO_SUB_BRANCH_EN : DEMO_ALTERNATE_EN
  return subBranch ? DEMO_SUB_BRANCH : DEMO_ALTERNATE
}
