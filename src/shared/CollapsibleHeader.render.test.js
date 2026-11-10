import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import CollapsibleHeader from './CollapsibleHeader.js'

describe('CollapsibleHeader', () => {
  const render = (open) => renderToStaticMarkup(
    <CollapsibleHeader className="X" open={open} onToggle={() => {}} controls="body-1">Title</CollapsibleHeader>,
  )

  it('points aria-controls at the body only while open', () => {
    assert.match(render(true), /<button type="button" class="X Monster__collapsible" aria-expanded="true" aria-controls="body-1"><span class="Monster__collapse-icon Monster__collapse-icon--open" aria-hidden="true"><\/span>Title<\/button>/)
    assert.match(render(false), /aria-expanded="false">/)
    assert.doesNotMatch(render(false), /aria-controls/)
  })
})
