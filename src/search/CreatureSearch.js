import React, { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'

// CreatureSearch is a debounced type-ahead for picking a creature/NPC. The
// library owns the UX (debounce, stale-response guard, result rendering); the
// CONSUMER owns the data via the `search` callback — so auth, base URL, request
// signing, and which types to query all live in the app, not here. The harness
// passes a fetch to /search/suggest/unified; encounter-builder-web passes its
// own X-Access-Token'd client. onSelect fires with the chosen result (or its
// `alternate`, an edition equivalent).
export default function CreatureSearch({
  search,
  onSelect,
  placeholder = 'Search creatures & NPCs…',
  minChars = 2,
  debounceMs = 250,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  // Monotonic token: only the newest in-flight search may commit its results, so
  // a slow early request can't overwrite a fast later one (out-of-order races).
  const seq = useRef(0)

  useEffect(() => {
    if (query.length < minChars) {
      setResults([])
      setLoading(false)
      return
    }
    const mine = ++seq.current
    setLoading(true)
    const timer = setTimeout(async () => {
      try {
        const data = await search(query)
        if (mine === seq.current) setResults(data || [])
      } catch {
        if (mine === seq.current) setResults([])
      } finally {
        if (mine === seq.current) setLoading(false)
      }
    }, debounceMs)
    return () => clearTimeout(timer) // a new keystroke cancels the pending fetch
  }, [query, minChars, debounceMs, search])

  return (
    <div className="CreatureSearch">
      <input
        type="text"
        className="CreatureSearch__input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid="creature-search"
        autoFocus
      />
      <div className="CreatureSearch__results">
        {loading && <div className="CreatureSearch__status">Searching…</div>}
        {!loading && query.length >= minChars && results.length === 0 && (
          <div className="CreatureSearch__status">No results</div>
        )}
        {results.map((r) => (
          <CreatureSearchResult key={r.game_id} result={r} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function CreatureSearchResult({ result, onSelect }) {
  return (
    <div
      className="CreatureSearch__result"
      data-testid="search-result"
      data-name={result.name}
      onClick={() => onSelect(result)}
    >
      <div className="CreatureSearch__name">{result.name}</div>
      <div className="CreatureSearch__meta">
        {result.type}
        {result.level != null ? ` · Lvl ${result.level}` : ''}
        {result.edition ? ` · ${result.edition}` : ''}
      </div>
      {result.alternate && (
        <div
          className="CreatureSearch__alternate"
          data-testid="search-result-alternate"
          onClick={(e) => {
            e.stopPropagation()
            onSelect(result.alternate)
          }}
        >
          ↔ {result.alternate.name} ({result.alternate.edition})
        </div>
      )}
    </div>
  )
}

const resultShape = PropTypes.shape({
  game_id: PropTypes.string,
  name: PropTypes.string,
  type: PropTypes.string,
  level: PropTypes.number,
  edition: PropTypes.string,
})

CreatureSearch.propTypes = {
  // search(query) -> Promise<result[]>. Consumer-owned (auth, URL, types).
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}

CreatureSearchResult.propTypes = {
  result: PropTypes.shape({
    game_id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    level: PropTypes.number,
    edition: PropTypes.string,
    alternate: resultShape,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
}
