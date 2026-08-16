import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Ability from './Ability.js'

// 2ne: Ability.js computed its trailing period and its section separators by mutating
// render-local variables (`period` set as a side effect of the stat-line renderers;
// `semicolon` flipped " "→"; " by a separator() closure). These characterization
// tests lock the exact output so the mutation can be replaced by pure derivation:
//   - a stat line (area/range/save/damage) puts a "." before the ability text;
//   - the detail sections + stages are separated by "; ", the FIRST by " ";
//   - sections render only when present; stages render for every stage entry.

const rich = {
  name: 'Breath Weapon',
  action_type: { name: 'two-actions' },
  traits: [{ name: 'fire' }, { name: 'evocation' }],
  area: [{ size: 20, unit: 'foot', shape: 'cone' }],
  range: { range: 30, unit: 'feet' },
  saving_throw: { dc: 25, save_type: 'Reflex', basic: true },
  damage: [{ formula: '4d6', damage_type: 'fire' }],
  text: 'The dragon breathes fire.',
  cost: '1 Focus Point',
  frequency: 'once per day',
  effect: 'Deals fire damage.',
  stages: [{ name: 'Stage 1', text: 'sick' }, { name: 'Stage 2', text: 'sicker' }],
  special: 'Recharges on a 5-6.',
}

describe('Ability (render) — period + separators', () => {
  const html = renderToStaticMarkup(<Ability ability={rich} i={0} basePath="/x" />)

  it('renders the stat line', () => {
    assert.match(html, /<strong class="Monster__ability-label">Area<\/strong> 20-foot cone/)
    assert.match(html, /<strong class="Monster__ability-label">Range<\/strong> <span>30 feet<\/span>/)
    assert.match(html, /<strong class="Monster__ability-label">Save<\/strong> <span>basic DC 25 Reflex<\/span>/)
    assert.match(html, /<strong class="Monster__ability-label">Damage<\/strong> 4d6 fire /)
  })

  it('puts a "." before the ability text when a stat line is present', () => {
    assert.match(html, /4d6 fire <\/span>\. <span class="Markdown">The dragon breathes fire\.<\/span>/)
  })

  it('separates the FIRST detail section with " " and the rest with "; "', () => {
    assert.match(html, /<span> <strong class="Monster__ability-label">Cost<\/strong>/) // first → " "
    assert.match(html, /<span>; <strong class="Monster__ability-label">Frequency<\/strong>/) // rest → "; "
    assert.match(html, /<span>; <strong class="Monster__ability-label">Effect<\/strong>/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Stage 1<\/strong>/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Stage 2<\/strong>/)
    assert.match(html, /<span>; <strong class="Monster__ability-label">Special<\/strong>/)
  })

  it('orders sections then stages then special, matching the JSX order', () => {
    const order = ['Cost', 'Frequency', 'Effect', 'Stage 1', 'Stage 2', 'Special'].map((s) => html.indexOf(s))
    assert.deepStrictEqual(
      order,
      [...order].sort((a, b) => a - b),
      'detail segments must stay in cost→frequency→effect→stages→special order',
    )
  })
})

describe('Ability (render) — no stat line', () => {
  it('omits the "." before the text when there is no area/range/save/damage', () => {
    const html = renderToStaticMarkup(
      <Ability ability={{ name: 'Aura', text: 'A quiet aura.' }} i={0} basePath="/x" />,
    )
    // No stat line → the text is not preceded by a period.
    assert.doesNotMatch(html, /\. <span class="Markdown">A quiet aura\./)
    assert.match(html, /<span class="Markdown">A quiet aura\.<\/span>/)
  })
})
