import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { searchKey } from '../lib/geo'
import { useChronos } from '../store/useChronos'

export function CountrySearch() {
  const phase = useChronos((s) => s.phase)
  const countries = useChronos((s) => s.countries)
  const select = useChronos((s) => s.select)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const index = useMemo(() => countries.map((c) => ({ c, key: searchKey(c.name) })), [countries])
  const matches = useMemo(() => {
    const q = searchKey(query.trim())
    if (!q) return []
    const starts = index.filter((e) => e.key.startsWith(q))
    const contains = index.filter((e) => !e.key.startsWith(q) && e.key.includes(q))
    return [...starts, ...contains].slice(0, 6).map((e) => e.c)
  }, [index, query])

  if (phase === 'intro') return null

  const choose = (i: number) => {
    const c = matches[i]
    if (!c) return
    select(c.index)
    setQuery('')
  }

  return (
    <motion.div
      className="pointer-events-auto absolute top-24 right-4 left-4 sm:top-7 sm:right-7 sm:left-auto sm:w-72"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.8 }}
    >
      <label className="sr-only" htmlFor="country-search">
        Rechercher un pays
      </label>
      <input
        id="country-search"
        type="search"
        autoComplete="off"
        placeholder="Rechercher un pays…"
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
                onMouseEnter={() => setActive(i)}
                onClick={() => choose(i)}
                className={`w-full px-4 py-2 text-left text-sm ${i === active ? 'bg-real/12 text-real' : ''}`}
              >
                {c.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </motion.div>
  )
}
