import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CreatureSearch from './CreatureSearch.js'

// Render-level tests only reach the initial (pre-effect) markup — renderToStaticMarkup
// doesn't run effects, so the debounced fetch, stale-response guard, and result
// rendering are covered by the Playwright spec (e2e/creature-search.spec.js) against
// the real harness. Here we pin the static contract: the input and its hooks.
describe('CreatureSearch (render)', () => {
  const noop = () => {}

  it('renders the search input with the test hook and default placeholder', () => {
    const html = renderToStaticMarkup(<CreatureSearch search={noop} onSelect={noop} />)
    assert.match(html, /class="CreatureSearch"/)
    assert.match(html, /class="CreatureSearch__input"/)
    assert.match(html, /data-testid="creature-search"/)
    assert.match(html, /placeholder="Search creatures/)
  })

  it('honors a custom placeholder', () => {
    const html = renderToStaticMarkup(
      <CreatureSearch search={noop} onSelect={noop} placeholder="Find a monster" />,
    )
    assert.match(html, /placeholder="Find a monster"/)
  })

  it('shows no results or status before any query is typed', () => {
    const html = renderToStaticMarkup(<CreatureSearch search={noop} onSelect={noop} />)
    assert.doesNotMatch(html, /CreatureSearch__result"/) // no result rows
    assert.doesNotMatch(html, /Searching/) // not loading at rest
  })
})
