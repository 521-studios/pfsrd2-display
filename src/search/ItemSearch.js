import React from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'

// ItemSearch is a debounced type-ahead for picking equipment/weapons/armor/
// shields. Same contract as CreatureSearch (the suggest endpoint returns the
// same result shape for items): the CONSUMER owns the data via `search`, the
// library owns the UX. Pair with the exported ItemCard to render the picked
// item. See TypeAhead.
export default function ItemSearch(props) {
  return (
    <TypeAhead
      {...props}
      block="ItemSearch"
      inputTestId="item-search"
      resultTestId="item-search-result"
      placeholder={props.placeholder ?? 'Search items…'}
    />
  )
}

ItemSearch.propTypes = {
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
