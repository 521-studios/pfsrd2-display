import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { TraitChips, FacetSelect } from './filters.js'

// Static contract only — the debounced suggest, the loadFacets effect, and chip
// add/remove interactions are e2e-covered (e2e/search-filters.spec.js). Effects
// don't run under renderToStaticMarkup, so here we pin the initial markup.
describe('TraitChips (render)', () => {
  const noop = () => {}

  it('renders a chip (with a remove control) per selected trait, plus the input', () => {
    const html = renderToStaticMarkup(
      <TraitChips value={['Undead', 'Fire']} onChange={noop} suggest={noop} block="ItemSearch" />,
    )
    assert.match(html, /ItemSearch__chip"[^>]*>Undead/)
    assert.match(html, /ItemSearch__chip"[^>]*>Fire/)
    assert.match(html, /aria-label="remove Undead"/)
    assert.match(html, /data-testid="ItemSearch-trait-input"/)
  })

  it('renders no chips when nothing is selected', () => {
    const html = renderToStaticMarkup(
      <TraitChips value={[]} onChange={noop} suggest={noop} block="CreatureSearch" />,
    )
    assert.doesNotMatch(html, /CreatureSearch__chip"/)
  })
})

describe('FacetSelect (render)', () => {
  const noop = () => {}

  it('renders category + subcategory selects with the "All" placeholders', () => {
    const html = renderToStaticMarkup(
      <FacetSelect
        loadFacets={() => Promise.resolve({})}
        category=""
        subcategory=""
        onCategory={noop}
        onSubcategory={noop}
        block="ItemSearch"
      />,
    )
    assert.match(html, /data-testid="ItemSearch-category"/)
    assert.match(html, />All categories</)
    assert.match(html, />All subcategories</)
    // subcategory disabled until a category is picked
    assert.match(html, /aria-label="subcategory" disabled=""/)
  })
})
