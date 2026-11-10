import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import Collapsible from './Collapsible.js'

describe('Collapsible', () => {
  const render = (defaultOpen) => renderToStaticMarkup(
    <Collapsible headerClassName="X" header="Title" bodyClassName="Y" defaultOpen={defaultOpen}>Body</Collapsible>,
  )

  it('points aria-controls at the mounted body while open', () => {
    const html = render(true)
    const [, controls] = html.match(/aria-controls="([^"]+)"/)
    assert.match(html, /<button type="button" class="X Monster__collapsible" aria-expanded="true" aria-controls="[^"]+"><span class="Monster__collapse-icon Monster__collapse-icon--open" aria-hidden="true"><\/span>Title<\/button>/)
    assert.ok(html.includes(`<div class="Y" id="${controls}">Body</div>`), html)
  })

  it('unmounts the body and drops aria-controls while collapsed', () => {
    const html = render(false)
    assert.match(html, /aria-expanded="false">/)
    assert.doesNotMatch(html, /aria-controls|Body/)
  })
})
