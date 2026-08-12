import { useState, useEffect, useRef } from 'react'

// useTypeahead is the shared engine behind CreatureSearch and ItemSearch: a
// debounced query with a monotonic stale-response guard. The CONSUMER owns the
// data via `search(query) => Promise<results[]>` (auth, URL, which types); this
// hook owns only the timing/ordering. Kept separate from rendering so both
// searches share one correct copy of the tricky async-ordering logic.
export default function useTypeahead({ search, minChars = 2, debounceMs = 250 }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  // Only the newest in-flight search may commit, so a slow early request can't
  // overwrite a fast later one (out-of-order races).
  const seq = useRef(0)
  // Hold the latest `search` in a ref so an unmemoized callback prop doesn't
  // re-run the effect (re-arming the debounce) on every consumer render.
  const searchRef = useRef(search)
  useEffect(() => {
    searchRef.current = search
  }, [search])

  useEffect(() => {
    // Bump the token BEFORE the early-return: shortening the query below minChars
    // must also invalidate any in-flight fetch, else its stale response would
    // commit results for a query the input no longer shows.
    const mine = ++seq.current
    if (query.length < minChars) {
      setResults([])
      setLoading(false)
      return
    }
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await searchRef.current(query)
        if (mine === seq.current) setResults(data || [])
      } catch {
        if (mine === seq.current) setResults([])
      } finally {
        if (mine === seq.current) setLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(timer) // a new keystroke cancels the pending fetch
  }, [query, minChars, debounceMs])

  return { query, setQuery, results, loading }
}
