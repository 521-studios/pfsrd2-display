import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'
import { TraitChips, LevelRange } from './filters.js'

// CreatureSearch is a debounced type-ahead for picking a creature/NPC. The
// library owns the UX (debounce, stale-response guard, result rendering); the
// CONSUMER owns the data via the `search` callback — so auth, base URL, request
// signing, and which types to query all live in the app. onSelect fires with the
// chosen result (or its `alternate`, an edition equivalent). See TypeAhead.
//
// Optional trait filtering: pass `suggestTraits(prefix, selected) => Promise<string[]>`
// and a trait-chip filter appears. Selected traits AND together and are handed to
// `search(query, { traits })` so the consumer forwards them to the API.
export default function CreatureSearch({ suggestTraits, levelFilter, ...props }) {
  const [traits, setTraits] = useState([])
  const [levelMin, setLevelMin] = useState('')
  const [levelMax, setLevelMax] = useState('')
  const filters = useMemo(
    () => ({ traits, levelMin, levelMax }),
    [traits, levelMin, levelMax],
  )

  const filterBar =
    suggestTraits || levelFilter ? (
      <div className="CreatureSearch__filters">
        {levelFilter ? (
          <LevelRange min={levelMin} max={levelMax} onMin={setLevelMin} onMax={setLevelMax} block="CreatureSearch" />
        ) : null}
        {suggestTraits ? (
          <TraitChips value={traits} onChange={setTraits} suggest={suggestTraits} block="CreatureSearch" />
        ) : null}
      </div>
    ) : null

  return (
    <TypeAhead
      {...props}
      filters={filters}
      filterBar={filterBar}
      block="CreatureSearch"
      inputTestId="creature-search"
      resultTestId="search-result"
      placeholder={props.placeholder ?? 'Search creatures & NPCs…'}
    />
  )
}

CreatureSearch.propTypes = {
  // search(query, filters) -> Promise<result[]>.
  // filters = { traits: string[], levelMin: string, levelMax: string }.
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  // suggestTraits(prefix, selected) -> Promise<string[]>. Omit to hide the chips.
  suggestTraits: PropTypes.func,
  // levelFilter: show min/max level inputs (values flow via filters).
  levelFilter: PropTypes.bool,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
