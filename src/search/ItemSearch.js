import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'
import { TraitChips, FacetSelect } from './filters.js'

// ItemSearch is a debounced type-ahead for picking equipment/weapons/armor/
// shields. Same contract as CreatureSearch (the suggest endpoint returns the
// same result shape for items): the CONSUMER owns the data via `search`, the
// library owns the UX. Pair with the exported ItemCard to render the picked
// item. See TypeAhead.
//
// Optional filtering:
//   - `suggestTraits(prefix, selected)` adds a trait-chip filter.
//   - `loadFacets()` adds cascading category / subcategory dropdowns.
// Active filters flow to `search(query, { traits, category, subcategory })`.
export default function ItemSearch({ suggestTraits, loadFacets, ...props }) {
  const [traits, setTraits] = useState([])
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const filters = useMemo(
    () => ({ traits, category, subcategory }),
    [traits, category, subcategory],
  )

  const filterBar =
    suggestTraits || loadFacets ? (
      <div className="ItemSearch__filters">
        {loadFacets && (
          <FacetSelect
            loadFacets={loadFacets}
            category={category}
            subcategory={subcategory}
            onCategory={(c) => {
              setCategory(c)
              setSubcategory('') // subcategory options depend on category
            }}
            onSubcategory={setSubcategory}
            block="ItemSearch"
          />
        )}
        {suggestTraits && (
          <TraitChips value={traits} onChange={setTraits} suggest={suggestTraits} block="ItemSearch" />
        )}
      </div>
    ) : null

  return (
    <TypeAhead
      {...props}
      filters={filters}
      filterBar={filterBar}
      block="ItemSearch"
      inputTestId="item-search"
      resultTestId="item-search-result"
      placeholder={props.placeholder ?? 'Search items…'}
    />
  )
}

ItemSearch.propTypes = {
  // search(query, filters) -> Promise<result[]>.
  // filters = { traits: string[], category: string, subcategory: string }.
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  // suggestTraits(prefix, selected) -> Promise<string[]>. Omit to hide the chips.
  suggestTraits: PropTypes.func,
  // loadFacets() -> Promise<{category: string[]}>. Omit to hide the dropdowns.
  loadFacets: PropTypes.func,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
