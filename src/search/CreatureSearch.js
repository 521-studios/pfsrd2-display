import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'
import { TraitChips } from './filters.js'

// CreatureSearch is a debounced type-ahead for picking a creature/NPC. The
// library owns the UX (debounce, stale-response guard, result rendering); the
// CONSUMER owns the data via the `search` callback — so auth, base URL, request
// signing, and which types to query all live in the app. onSelect fires with the
// chosen result (or its `alternate`, an edition equivalent). See TypeAhead.
//
// Optional trait filtering: pass `suggestTraits(prefix, selected) => Promise<string[]>`
// and a trait-chip filter appears. Selected traits AND together and are handed to
// `search(query, { traits })` so the consumer forwards them to the API.
export default function CreatureSearch({ suggestTraits, ...props }) {
  const [traits, setTraits] = useState([])
  const filters = useMemo(() => ({ traits }), [traits])

  return (
    <TypeAhead
      {...props}
      filters={filters}
      filterBar={
        suggestTraits ? (
          <TraitChips value={traits} onChange={setTraits} suggest={suggestTraits} block="CreatureSearch" />
        ) : null
      }
      block="CreatureSearch"
      inputTestId="creature-search"
      resultTestId="search-result"
      placeholder={props.placeholder ?? 'Search creatures & NPCs…'}
    />
  )
}

CreatureSearch.propTypes = {
  // search(query, filters) -> Promise<result[]>. filters = { traits: string[] }.
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  // suggestTraits(prefix, selected) -> Promise<string[]>. Omit to hide the filter.
  suggestTraits: PropTypes.func,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
