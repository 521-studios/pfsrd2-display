import React, { useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import TypeAhead from './TypeAhead.js'
import { TraitChips, FacetSelect, LevelRange } from './filters.js'

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
export default function ItemSearch({ suggestTraits, loadFacets, levelFilter, ...props }) {
  const [traits, setTraits] = useState([])
  const [category, setCategory] = useState('')
  const [subcategory, setSubcategory] = useState('')
  const [levelMin, setLevelMin] = useState('')
  const [levelMax, setLevelMax] = useState('')
  const filters = useMemo(
    () => ({ traits, category, subcategory, levelMin, levelMax }),
    [traits, category, subcategory, levelMin, levelMax],
  )

  const filterBar =
    suggestTraits || loadFacets || levelFilter ? (
      <div className="ItemSearch__filters">
        {levelFilter && (
          <LevelRange min={levelMin} max={levelMax} onMin={setLevelMin} onMax={setLevelMax} block="ItemSearch" />
        )}
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
          <TraitChips
            value={traits}
            onChange={setTraits}
            // Inject the active facet so trait suggestions co-occur within the
            // selected category/subcategory (not just the item types + chips).
            suggest={(prefix, selected) => suggestTraits(prefix, selected, { category, subcategory })}
            // …and refetch when the facet changes, even without a blur/refocus.
            contextKey={JSON.stringify({ category, subcategory })}
            block="ItemSearch"
          />
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
  // search(query, filters) -> Promise<result[]>. filters =
  // { traits: string[], category, subcategory, levelMin, levelMax }.
  search: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  // suggestTraits(prefix, selected, { category, subcategory }) -> Promise<string[]>.
  // The 3rd arg is the active facet so suggestions co-occur within it. Omit to
  // hide the chips.
  suggestTraits: PropTypes.func,
  // loadFacets() -> Promise<{category: string[]}>. Omit to hide the dropdowns.
  loadFacets: PropTypes.func,
  // levelFilter: show min/max level inputs (values flow via filters).
  levelFilter: PropTypes.bool,
  placeholder: PropTypes.string,
  minChars: PropTypes.number,
  debounceMs: PropTypes.number,
}
