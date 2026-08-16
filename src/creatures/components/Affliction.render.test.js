import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Affliction from './Affliction.js'

// 2ne: Affliction.js computed its section separators by mutating a render-local
// `semicolon` via a separator() closure. These characterization tests lock the exact
// separator behaviour (first present segment " ", the rest "; ") across the
// heterogeneous segments — sections, the saving throw, and each stage — so the mutation
// can be replaced by position-derived separators.

const full = {
  name: 'Blightburn Sickness',
  traits: [{ name: 'disease' }],
  context: 'Contracted by touch.',
  saving_throw: { save_type: 'Fortitude', dc: 25 },
  requirements: 'exposed',
  effect: 'sickened 1',
  onset: '1 day',
  maximum_duration: '2 weeks',
  stages: [{ text: '4d6 poison' }, { text: '6d6 poison' }],
  special: 'ends on 2 saves',
  text: 'A wasting radiation sickness.',
}

describe('Affliction (render) — separators', () => {
  const html = renderToStaticMarkup(<Affliction affliction={full} i={0} />)

  it('separates the first segment with " " and the rest with "; "', () => {
    // context is first (null label → no <strong>): the " " separator + the section's
    // own leading space give two spaces before the Markdown.
    assert.match(html, /<span>  <span class="Markdown">Contracted by touch\.<\/span>/)
    // subsequent segments use "; "
    assert.match(html, /<span>; <strong class="Monster__ability-label">Saving Throw<\/strong>/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Onset<\/strong>/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Stage 1<\/strong> 4d6 poison/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Stage 2<\/strong> 6d6 poison/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Special<\/strong>/)
  })

  it('renders the saving throw with its custom markup', () => {
    assert.match(html, /<strong class="Monster__ability-label">Saving Throw<\/strong> <span>Fortitude DC 25<\/span>/)
  })

  it('keeps the segments in JSX order', () => {
    const order = ['Contracted by touch', 'Saving Throw', 'Requirements', 'Effect', 'Onset', 'Maximum Duration', 'Stage 1', 'Stage 2', 'Special', 'wasting radiation'].map((s) => html.indexOf(s))
    assert.deepStrictEqual(order, [...order].sort((a, b) => a - b))
  })
})

describe('Affliction (render) — first present segment gets the space separator', () => {
  it('a saving throw with no preceding section is prefixed with " "', () => {
    const html = renderToStaticMarkup(
      <Affliction affliction={{ name: 'Venom', saving_throw: { save_type: 'Fortitude', dc: 18 } }} i={0} />,
    )
    assert.match(html, /<span> <strong class="Monster__ability-label">Saving Throw<\/strong>/)
    assert.doesNotMatch(html, /<span>; <strong class="Monster__ability-label">Saving Throw/)
  })
})
