import React from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'

// CreatureSearch is a debounced type-ahead for picking a creature/NPC. The
// library owns the UX (debounce, stale-response guard, result rendering); the
// CONSUMER owns the data via the `search` callback — so auth, base URL, request
// signing, and which types to query all live in the app. onSelect fires with the
// chosen result (or its `alternate`, an edition equivalent). See TypeAhead.
export default function CreatureSearch(props) {
  return (
    <TypeAhead
      {...props}
      block="CreatureSearch"
      inputTestId="creature-search"
      resultTestId="search-result"
      placeholder={props.placeholder ?? 'Search creatures & NPCs…'}
    />
  )
}

CreatureSearch.propTypes = {
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
