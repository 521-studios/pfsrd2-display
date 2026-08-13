import React, { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'

// Filter controls for the library type-aheads. Like TypeAhead, the CONSUMER owns
// the data (the fetch to /search/traits and /search/facets, with auth/URL/types);
// the library owns the UX. Both are optional — a search component renders a filter
// only when its data callback is supplied.

// TraitChips is a chip-style trait filter with a co-occurrence typeahead. As you
// type, `suggest(prefix, selected)` returns the traits that still narrow the
// current selection (the "filtered by what's already selected" behavior lives in
// the API). Enter (or clicking an option) adds a chip; chips AND together.
export function TraitChips({ value, onChange, suggest, block, debounceMs = 200, contextKey = '' }) {
  const [input, setInput] = useState('')
  const [options, setOptions] = useState([])
  // The prefix the current `options` were fetched for — Enter only accepts the
  // top suggestion when it's fresh for what's typed (guards a stale commit if
  // Enter is hit mid-debounce after a fast prefix change).
  const [optionsFor, setOptionsFor] = useState('')
  // Options show only while the input is focused, so nothing appears unprompted
  // on mount. Option picks use onMouseDown+preventDefault (keeps focus, matches
  // the harness SpellCombobox), so blur can hide them without racing the click.
  const [focused, setFocused] = useState(false)
  // Newest suggest wins (same stale-response guard as TypeAhead).
  const seq = useRef(0)
  const suggestRef = useRef(suggest)
  useEffect(() => {
    suggestRef.current = suggest
  }, [suggest])

  // Re-suggest on prefix change, selection change (adding/removing a chip
  // re-narrows), AND when the consumer's filter context changes (contextKey —
  // e.g. an item's category/subcategory) so a facet change refetches even if it
  // didn't blur the input.
  const selectedKey = JSON.stringify(value)
  useEffect(() => {
    if (!focused) return undefined
    const mine = ++seq.current
    const q = input.trim()
    const timer = setTimeout(async () => {
      try {
        const data = await suggestRef.current(q, value)
        if (mine === seq.current) {
          setOptions((data || []).filter((t) => !value.includes(t)))
          setOptionsFor(q)
        }
      } catch {
        if (mine === seq.current) {
          setOptions([])
          setOptionsFor(q)
        }
      }
    }, debounceMs)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, selectedKey, debounceMs, focused, contextKey])

  const add = (trait) => {
    const t = (trait || '').trim()
    if (t && !value.includes(t)) onChange([...value, t])
    setInput('')
    setOptions([])
  }
  const remove = (trait) => onChange(value.filter((t) => t !== trait))

  return (
    <div className={`${block}__filter ${block}__traits`} data-testid={`${block}-trait-filter`}>
      {value.map((t) => (
        <span key={t} className={`${block}__chip`} data-testid={`${block}-chip`}>
          {t}
          <button
            type="button"
            className={`${block}__chip-remove`}
            aria-label={`remove ${t}`}
            onClick={() => remove(t)}
          >
            ×
          </button>
        </span>
      ))}
      <input
        type="text"
        className={`${block}__chip-input`}
        placeholder="filter by trait…"
        value={input}
        data-testid={`${block}-trait-input`}
        onChange={(e) => setInput(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            // Commit only an API-sourced option (canonical casing), never free
            // text — the trait vocabulary comes from the API. An exact case-
            // insensitive match always wins; otherwise the top suggestion, but
            // only when it's fresh for what's typed (else no-op).
            const typed = input.trim()
            const exact = options.find((o) => o.toLowerCase() === typed.toLowerCase())
            const pick = exact || (optionsFor === typed ? options[0] : undefined)
            if (pick) add(pick)
          } else if (e.key === 'Backspace' && input === '' && value.length) {
            remove(value[value.length - 1]) // backspace on empty removes last chip
          }
        }}
      />
      {focused && options.length > 0 && (
        <div className={`${block}__chip-options`}>
          {options.map((o) => (
            <div
              key={o}
              className={`${block}__chip-option`}
              data-testid={`${block}-trait-option`}
              onMouseDown={(e) => {
                e.preventDefault() // keep input focus; commit before blur
                add(o)
              }}
            >
              {o}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

TraitChips.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
  onChange: PropTypes.func.isRequired,
  // suggest(prefix, selected) -> Promise<string[]>. Consumer-owned.
  suggest: PropTypes.func.isRequired,
  block: PropTypes.string.isRequired,
  debounceMs: PropTypes.number,
  // Opaque key; when it changes, options refetch (e.g. the active item facet).
  contextKey: PropTypes.string,
}

// FacetSelect renders cascading category → subcategory dropdowns for item search.
// `loadFacets()` resolves the {category: [subcategories]} map (consumer fetches
// /search/facets and unwraps `categories`). Picking a category resets the
// subcategory and repopulates its options.
export function FacetSelect({ loadFacets, category, subcategory, onCategory, onSubcategory, block }) {
  const [facets, setFacets] = useState(null)
  // Hold loadFacets in a ref (like TypeAhead's searchRef) so an unmemoized
  // callback prop can't refetch on every render. Load once on mount.
  const loadRef = useRef(loadFacets)
  useEffect(() => {
    loadRef.current = loadFacets
  }, [loadFacets])
  useEffect(() => {
    let alive = true
    loadRef.current()
      .then((f) => alive && setFacets(f || {}))
      .catch(() => alive && setFacets({}))
    return () => {
      alive = false
    }
  }, [])

  const categories = facets ? Object.keys(facets).sort() : []
  const subcategories = (facets && category && facets[category]) || []

  return (
    <div className={`${block}__filter ${block}__facets`} data-testid={`${block}-facet-filter`}>
      <select
        className={`${block}__facet-select`}
        aria-label="category"
        value={category}
        data-testid={`${block}-category`}
        onChange={(e) => onCategory(e.target.value)}
      >
        <option value="">All categories</option>
        {categories.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        className={`${block}__facet-select`}
        aria-label="subcategory"
        value={subcategory}
        disabled={!category || subcategories.length === 0}
        data-testid={`${block}-subcategory`}
        onChange={(e) => onSubcategory(e.target.value)}
      >
        <option value="">All subcategories</option>
        {subcategories.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>
  )
}

FacetSelect.propTypes = {
  // loadFacets() -> Promise<{category: string[]}>. Consumer-owned.
  loadFacets: PropTypes.func.isRequired,
  category: PropTypes.string.isRequired,
  subcategory: PropTypes.string.isRequired,
  onCategory: PropTypes.func.isRequired,
  onSubcategory: PropTypes.func.isRequired,
  block: PropTypes.string.isRequired,
}

// LevelRange is an inclusive min/max level filter (two number inputs). Needs no
// data callback — the values flow through `filters` and the consumer forwards
// them (level_min/level_max) to the API. Blank bounds are open-ended.
export function LevelRange({ min, max, onMin, onMax, block }) {
  return (
    <div className={`${block}__filter ${block}__level`} data-testid={`${block}-level-filter`}>
      <span className={`${block}__level-label`}>Level</span>
      <input
        type="number"
        className={`${block}__level-input`}
        aria-label="min level"
        placeholder="min"
        value={min}
        data-testid={`${block}-level-min`}
        onChange={(e) => onMin(e.target.value)}
      />
      <span className={`${block}__level-dash`} aria-hidden="true">–</span>
      <input
        type="number"
        className={`${block}__level-input`}
        aria-label="max level"
        placeholder="max"
        value={max}
        data-testid={`${block}-level-max`}
        onChange={(e) => onMax(e.target.value)}
      />
    </div>
  )
}

LevelRange.propTypes = {
  min: PropTypes.string.isRequired,
  max: PropTypes.string.isRequired,
  onMin: PropTypes.func.isRequired,
  onMax: PropTypes.func.isRequired,
  block: PropTypes.string.isRequired,
}
