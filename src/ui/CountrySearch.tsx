import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { searchKey } from '../lib/geo'
import { useChronos } from '../store/useChronos'
import { countryName } from '../lib/countries'
import { useLang, useT } from '../i18n'

export function CountrySearch() {
  const phase = useChronos((s) => s.phase)
  const countries = useChronos((s) => s.countries)
  const select = useChronos((s) => s.select)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const lang = useLang((s) => s.lang)
  const t = useT()

  // names in both languages are searchable; the current language ranks first
  const index = useMemo(
    () =>
      countries.map((c) => ({
        c,
        current: searchKey(c.names[lang]),
        other: searchKey(c.names[lang === 'fr' ? 'en' : 'fr']),
      })),
    [countries, lang],
  )
  const matches = useMemo(() => {
    const q = searchKey(query.trim())
    if (!q) return []
    const rank = (e: (typeof index)[number]) =>
      e.current.startsWith(q) ? 0 : e.other.startsWith(q) ? 1 : e.current.includes(q) || e.other.includes(q) ? 2 : 3
    return index
      .map((e) => ({ e, r: rank(e) }))
      .filter(({ r }) => r < 3)
      .sort((a, b) => a.r - b.r)
      .slice(0, 6)
      .map(({ e }) => e.c)
  }, [index, query])

  if (phase !== 'globe' && phase !== 'zone') return null

  const choose = (i: number) => {
    const c = matches[i]
    if (!c) return
    select(c.index)
    setQuery('')
  }

  return (
    <motion.div
      className="pointer-events-auto absolute top-24 right-4 left-4 sm:top-20 sm:right-7 sm:left-auto sm:w-72"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8 }}
    >
      <label className="sr-only" htmlFor="country-search">
        {t('search.label')}
      </label>
      <input
        id="country-search"
        type="search"
        autoComplete="off"
        placeholder={t('search.placeholder')}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setActive(0)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') setActive((a) => Math.min(a + 1, matches.length - 1))
          else if (e.key === 'ArrowUp') setActive((a) => Math.max(a - 1, 0))
          else if (e.key === 'Enter') choose(active)
          else if (e.key === 'Escape') setQuery('')
          else return
          e.preventDefault()
        }}
        className="glass w-full rounded-full px-4 py-2.5 text-sm placeholder:text-dust focus:border-real/60 focus:outline-none"
      />
      {matches.length > 0 && (
        <ul className="glass mt-2 overflow-hidden rounded-xl py-1" role="listbox">
          {matches.map((c, i) => (
            <li key={c.index} role="option" aria-selected={i === active}>
              <button
                type="button"
                onMouseMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`w-full px-4 py-2 text-left text-sm ${i === active ? 'bg-real/12 text-real' : ''}`}
              >
                {countryName(c, lang)}
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
