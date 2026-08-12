import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import TemplatePicker from './TemplatePicker.js'

// Static-render contract (the interactive apply/remove is e2e-covered via the
// harness in e2e/template-apply.spec.js). Pins the dropdown, the option list,
// the applied-stack tags, and the test hooks a spec targets.
describe('TemplatePicker (render)', () => {
  const noop = () => {}
  const templates = [
    { game_id: 'T:1', name: 'Elite' },
    { game_id: 'T:2', name: 'Weak' },
  ]

  it('renders the select with an option per template + the test hook', () => {
    const html = renderToStaticMarkup(<TemplatePicker templates={templates} onApply={noop} />)
    assert.match(html, /data-testid="template-select"/)
    assert.match(html, /<option value="T:1">Elite<\/option>/)
    assert.match(html, /<option value="T:2">Weak<\/option>/)
    assert.match(html, /\+ Add template/)
  })

  it('shows "Applying…" and disables the select while loading', () => {
    const html = renderToStaticMarkup(<TemplatePicker templates={templates} onApply={noop} loading />)
    assert.match(html, /Applying/)
    assert.match(html, /disabled/)
  })

  it('renders a tag per applied stack entry; remove only on the last', () => {
    const stack = [{ template: { name: 'Elite' } }, { template: { name: 'Fire' } }]
    const html = renderToStaticMarkup(
      <TemplatePicker templates={templates} stack={stack} onApply={noop} onRemoveLast={noop} onClearAll={noop} />,
    )
    assert.match(html, /Elite/)
    assert.match(html, /Fire/)
    assert.match(html, /Clear all/) // shown because stack length > 1
    // exactly one remove hook (on the last tag)
    assert.equal((html.match(/data-testid="template-remove"/g) || []).length, 1)
  })

  it('renders no stack region when nothing is applied', () => {
    const html = renderToStaticMarkup(<TemplatePicker templates={templates} onApply={noop} />)
    assert.doesNotMatch(html, /TemplatePicker__stack/)
    assert.doesNotMatch(html, /Clear all/)
  })
})
