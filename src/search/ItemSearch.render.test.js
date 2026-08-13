import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ItemSearch from './ItemSearch.js'

// ItemSearch is a thin preset over the shared TypeAhead (same as CreatureSearch),
// so like that test we pin only the static contract; interactive behavior is
// e2e-covered (e2e/item-search.spec.js). The distinct block + test ids are what
// let an item-search spec target it independently of the creature search.
describe('ItemSearch (render)', () => {
  const noop = () => {}

  it('renders the item-search input with its own block class + test hook', () => {
    const html = renderToStaticMarkup(<ItemSearch search={noop} onSelect={noop} />)
    assert.match(html, /class="ItemSearch"/)
    assert.match(html, /class="ItemSearch__input"/)
    assert.match(html, /data-testid="item-search"/)
    assert.match(html, /placeholder="Search items/)
  })

  it('honors a custom placeholder', () => {
    const html = renderToStaticMarkup(
      <ItemSearch search={noop} onSelect={noop} placeholder="Find loot" />,
    )
    assert.match(html, /placeholder="Find loot"/)
  })

  it('shows no result rows before a query is typed', () => {
    const html = renderToStaticMarkup(<ItemSearch search={noop} onSelect={noop} />)
    assert.doesNotMatch(html, /ItemSearch__result"/)
  })

  it('renders no filter controls when no filter callbacks are given', () => {
    const html = renderToStaticMarkup(<ItemSearch search={noop} onSelect={noop} />)
    assert.doesNotMatch(html, /ItemSearch-trait-input/)
    assert.doesNotMatch(html, /ItemSearch-category/)
  })

  it('renders the trait chip filter when suggestTraits is supplied', () => {
    const html = renderToStaticMarkup(
      <ItemSearch search={noop} onSelect={noop} suggestTraits={noop} />,
    )
    assert.match(html, /data-testid="ItemSearch-trait-input"/)
  })

  it('renders cascading category/subcategory selects when loadFacets is supplied', () => {
    const html = renderToStaticMarkup(
      <ItemSearch search={noop} onSelect={noop} loadFacets={() => Promise.resolve({})} />,
    )
    assert.match(html, /data-testid="ItemSearch-category"/)
    assert.match(html, /data-testid="ItemSearch-subcategory"/)
    // subcategory is disabled until a category is chosen
    assert.match(html, /aria-label="subcategory" disabled=""/)
  })
})

describe('ItemSearch level filter (render)', () => {
  const noop = () => {}
  it('shows the level inputs when levelFilter is set (and not otherwise)', () => {
    const bare = renderToStaticMarkup(<ItemSearch search={noop} onSelect={noop} />)
    assert.doesNotMatch(bare, /ItemSearch-level-min/)
    const withLevel = renderToStaticMarkup(<ItemSearch search={noop} onSelect={noop} levelFilter />)
    assert.match(withLevel, /data-testid="ItemSearch-level-min"/)
    assert.match(withLevel, /data-testid="ItemSearch-level-max"/)
  })
})
