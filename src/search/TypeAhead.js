import React from 'react'
import PropTypes from 'prop-types'
import useTypeahead from './useTypeahead.js'

// TypeAhead is the shared type-ahead UI behind CreatureSearch and ItemSearch —
// both search the same suggest endpoint and get the same result shape
// ({game_id, name, type, level, edition, alternate?}), so they differ only in
// BEM block name, test ids, and placeholder. Not exported; use the presets.
export default function TypeAhead({
  search,
  onSelect,
  placeholder,
  block,
  inputTestId,
  resultTestId,
  minChars = 2,
  debounceMs = 250,
}) {
  const { query, setQuery, results, loading } = useTypeahead({ search, minChars, debounceMs })

  return (
    <div className={block}>
      <input
        type="text"
        className={`${block}__input`}
        placeholder={placeholder}
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        data-testid={inputTestId}
        autoFocus
      />
      <div className={`${block}__results`}>
        {loading && <div className={`${block}__status`}>Searching…</div>}
        {!loading && query.length >= minChars && results.length === 0 && (
          <div className={`${block}__status`}>No results</div>
        )}
        {results.map((r) => (
          <TypeAheadResult
            key={r.game_id}
            result={r}
            onSelect={onSelect}
            block={block}
            resultTestId={resultTestId}
          />
        ))}
      </div>
    </div>
  )
}

function TypeAheadResult({ result, onSelect, block, resultTestId }) {
  return (
    <div
      className={`${block}__result`}
      data-testid={resultTestId}
      data-name={result.name}
      onClick={() => onSelect(result)}
    >
      <div className={`${block}__name`}>{result.name}</div>
      <div className={`${block}__meta`}>
        {result.type}
        {result.level != null ? ` · Lvl ${result.level}` : ''}
        {result.edition ? ` · ${result.edition}` : ''}
      </div>
      {result.alternate && (
        <div
          className={`${block}__alternate`}
          data-testid={`${resultTestId}-alternate`}
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

TypeAhead.propTypes = {
  // search(query) -> Promise<result[]>. Consumer-owned (auth, URL, types).
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  block: PropTypes.string.isRequired, // BEM block, e.g. "CreatureSearch"
  inputTestId: PropTypes.string,
  resultTestId: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}

TypeAheadResult.propTypes = {
  result: PropTypes.shape({
    game_id: PropTypes.string,
    name: PropTypes.string,
    type: PropTypes.string,
    level: PropTypes.number,
    edition: PropTypes.string,
    alternate: resultShape,
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  block: PropTypes.string.isRequired,
  resultTestId: PropTypes.string,
}
