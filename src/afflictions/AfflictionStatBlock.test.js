import { describe, it } from 'node:test'
import assert from 'node:assert'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import AfflictionStatBlock from './AfflictionStatBlock.js'

describe('AfflictionStatBlock', () => {
  it('renders a staged disease (onset + save + stages, using the doc stage shape)', () => {
    // Blueblisters shape: stages carry effect/duration/stage, NOT the creature `.text`.
    const doc = {
      affliction: {
        name: 'Blueblisters', affliction_type: 'disease', level: 3,
        traits: [{ name: 'Disease' }],
        description: 'A virulent pox.',
        saving_throw: { dc: 17, save_type: 'Fort', text: 'DC 17 Fortitude' },
        onset: '1 day',
        stages: [
          { name: 'Stage 1', stage: 1, effect: 'sickened 1', duration: '1 day' },
          { name: 'Stage 2', stage: 2, effect: 'sickened 2 and drained 1', duration: '1 day' },
        ],
      },
    }
    const html = renderToStaticMarkup(React.createElement(AfflictionStatBlock, { data: doc }))
    assert.match(html, /Blueblisters/)
    assert.match(html, /Disease 3/)
    assert.match(html, /Fort DC 17/)
    assert.match(html, /Onset/)
    assert.match(html, /Stage 1/)
    assert.match(html, /sickened 1/)
    assert.match(html, /\(1 day\)/)
    assert.match(html, /sickened 2 and drained 1/)
  })

  it('renders a standing curse: level_text, a text-only save, and an effect (no stages)', () => {
    const doc = {
      affliction: {
        name: 'Cursed Item', affliction_type: 'curse', level_text: 'Varies',
        traits: [{ name: 'Curse' }],
        description: 'A lingering hex.',
        saving_throw: { save_type: 'Will', text: 'Will save, high DC for its level' },
        effect: 'The bearer is clumsy 1.',
      },
    }
    const html = renderToStaticMarkup(React.createElement(AfflictionStatBlock, { data: doc }))
    assert.match(html, /Curse Varies/) // level_text in the header, not a fabricated number
    assert.match(html, /Will save, high DC/) // text-only save preserved
    assert.match(html, /Effect/)
    assert.match(html, /The bearer is clumsy 1/)
    assert.doesNotMatch(html, /Stage 1/) // a curse has no stages
  })

  it('accepts a top-level affliction and returns null for no data', () => {
    const flat = { name: 'Q', affliction_type: 'curse', level: 2, traits: [], description: 'd' }
    assert.match(renderToStaticMarkup(React.createElement(AfflictionStatBlock, { data: flat })), /Curse 2/)
    assert.equal(renderToStaticMarkup(React.createElement(AfflictionStatBlock, { data: null })), '')
  })
})
