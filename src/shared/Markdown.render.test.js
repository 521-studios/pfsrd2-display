import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Markdown from './Markdown.js'

// Render-level tests for the two rendering modes the public Markdown export
// supports. The distinction matters: inline is for short flavor strings inside a
// stat block; block is for multi-paragraph prose (an encounter description).
describe('Markdown', () => {
  it('renders inline by default: a <span>, paragraphs stripped', () => {
    const html = renderToStaticMarkup(<Markdown text="hello **world**" />)
    assert.match(html, /^<span class="Markdown"/)
    assert.match(html, /<strong>world<\/strong>/)
    assert.doesNotMatch(html, /<p>/) // inline strips paragraph wrapping
  })

  it('renders block prose: a <div>, paragraphs and headings preserved', () => {
    const html = renderToStaticMarkup(
      <Markdown block text={'# The Vault\n\nFirst para.\n\nSecond para.'} />,
    )
    assert.match(html, /class="Markdown Markdown--block"/)
    assert.match(html, /<h1>The Vault<\/h1>/)
    // Two separate paragraphs survive (inline mode would have collapsed them).
    assert.strictEqual((html.match(/<p>/g) || []).length, 2)
  })

  it('renders nothing for empty text', () => {
    assert.strictEqual(renderToStaticMarkup(<Markdown text="" />), '')
    assert.strictEqual(renderToStaticMarkup(<Markdown text={undefined} block />), '')
  })
})
