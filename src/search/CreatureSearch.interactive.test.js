import { describe, it, after, afterEach } from 'node:test'
import assert from 'node:assert'
import { JSDOM } from 'jsdom'
import React, { act } from 'react'

// The DOM globals must exist before react-dom loads: it feature-detects input
// events at import time and otherwise falls back to IE's attachEvent path.
const dom = new JSDOM('<!doctype html><html><body></body></html>')
globalThis.window = dom.window
globalThis.document = dom.window.document
// Node 21+ ships a global navigator; Node 20 (CI) doesn't, and react-dom reads it.
if (typeof navigator === 'undefined') globalThis.navigator = dom.window.navigator
globalThis.IS_REACT_ACT_ENVIRONMENT = true
const { createRoot } = await import('react-dom/client')
const { default: CreatureSearch } = await import('./CreatureSearch.js')

// Interactive coverage for the debounce + stale-response seq guard (x6sq):
// renderToStaticMarkup never runs effects, so these mount into jsdom and type.
// Real timers with a short debounce; search() returns promises the test
// resolves by hand to force out-of-order responses.

const DEBOUNCE = 20
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const afterDebounce = () => act(() => wait(DEBOUNCE + 15))

let root, container
after(() => {
  delete globalThis.window
  delete globalThis.document
  if (globalThis.navigator === dom.window.navigator) delete globalThis.navigator
  dom.window.close()
})
afterEach(() => {
  act(() => root.unmount())
  container.remove()
})

// search() stub: records each call and hands back a promise the test settles.
function deferredSearch() {
  const calls = []
  const search = (query, filters) =>
    new Promise((resolve, reject) => calls.push({ query, filters, resolve, reject }))
  return { search, calls }
}

function mount(search, props = {}) {
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  act(() => root.render(<CreatureSearch search={search} onSelect={() => {}} debounceMs={DEBOUNCE} {...props} />))
}

// Controlled input: set the value through the native setter so React's
// onChange sees the change, then fire the input event it listens for.
function type(text, testId = 'creature-search') {
  const input = container.querySelector(`[data-testid="${testId}"]`)
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  act(() => {
    setter.call(input, text)
    input.dispatchEvent(new window.Event('input', { bubbles: true }))
  })
}

const names = () => [...container.querySelectorAll('[data-testid="search-result"]')].map((n) => n.dataset.name)
const status = () => container.querySelector('.CreatureSearch__status')?.textContent ?? null
const row = (name) => ({ game_id: name, name, type: 'monsters' })

describe('CreatureSearch (interactive)', () => {
  it('debounces keystrokes into one search for the final query', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('go')
    type('gob')
    type('gobl')
    assert.strictEqual(calls.length, 0, 'nothing fires before the debounce')
    assert.strictEqual(status(), 'Searching…')
    await afterDebounce()
    assert.deepStrictEqual(calls.map((c) => c.query), ['gobl'])
    await act(async () => calls[0].resolve([row('Goblin Warrior')]))
    assert.deepStrictEqual(names(), ['Goblin Warrior'])
    assert.strictEqual(status(), null)
  })

  it('drops a slow earlier response that resolves after a newer one', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('gob')
    await afterDebounce()
    type('gobl')
    await afterDebounce()
    assert.deepStrictEqual(calls.map((c) => c.query), ['gob', 'gobl'])
    await act(async () => calls[1].resolve([row('Goblin Warrior')]))
    await act(async () => calls[0].resolve([row('Gobbler')])) // stale, out of order
    assert.deepStrictEqual(names(), ['Goblin Warrior'])
  })

  it('a stale settle while the newer search is pending keeps loading, then the newer one commits', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('gob')
    await afterDebounce()
    type('gobl')
    await afterDebounce()
    // Stale call settles while the newer one is still pending: loading must hold.
    await act(async () => calls[0].reject(new Error('slow failure')))
    assert.strictEqual(status(), 'Searching…')
    await act(async () => calls[1].resolve([row('Goblin Warrior')]))
    assert.deepStrictEqual(names(), ['Goblin Warrior'])
    assert.strictEqual(status(), null)
  })

  it('shortening below minChars invalidates the in-flight search (PR #34 regression)', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('gob')
    await afterDebounce()
    assert.strictEqual(calls.length, 1)
    type('g') // below minChars=2: must bump the seq before the early return
    await act(async () => calls[0].resolve([row('Goblin Warrior')]))
    assert.deepStrictEqual(names(), [])
    assert.strictEqual(status(), null, 'not stuck on Searching… and no "No results" for a short query')
    assert.strictEqual(calls.length, 1, 'a short query never searches')
  })

  it('shows "No results" when the search fails or returns nothing', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('zzz')
    await afterDebounce()
    await act(async () => calls[0].reject(new Error('boom')))
    assert.deepStrictEqual(names(), [])
    assert.strictEqual(status(), 'No results')
  })

  it('shows "No results" for an empty result set', async () => {
    const { search, calls } = deferredSearch()
    mount(search)
    type('zzz')
    await afterDebounce()
    await act(async () => calls[0].resolve([]))
    assert.strictEqual(status(), 'No results')
  })

  it('a filter alone runs the search with an empty query, and filter changes re-run it', async () => {
    const { search, calls } = deferredSearch()
    mount(search, { levelFilter: true })
    type('3', 'CreatureSearch-level-min')
    await afterDebounce()
    assert.strictEqual(calls.length, 1)
    assert.strictEqual(calls[0].query, '')
    assert.strictEqual(calls[0].filters.levelMin, '3')
    type('5', 'CreatureSearch-level-max')
    await afterDebounce()
    assert.strictEqual(calls.length, 2)
    assert.deepStrictEqual([calls[1].filters.levelMin, calls[1].filters.levelMax], ['3', '5'])
    await act(async () => calls[1].resolve([row('Ogre')]))
    assert.deepStrictEqual(names(), ['Ogre'])
  })
})
