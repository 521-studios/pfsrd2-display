import { describe, it } from 'node:test'
import assert from 'node:assert'
import { capitalize, comma, decoratedNumber } from './utils.js'

describe('capitalize', () => {
  it('capitalizes first character', () => {
    assert.strictEqual(capitalize('hello'), 'Hello')
  })

  it('returns empty string for empty input', () => {
    assert.strictEqual(capitalize(''), '')
  })

  it('returns empty string for falsy input', () => {
    assert.strictEqual(capitalize(null), '')
    assert.strictEqual(capitalize(undefined), '')
  })

  it('handles single character', () => {
    assert.strictEqual(capitalize('a'), 'A')
  })

  it('does not modify already capitalized', () => {
    assert.strictEqual(capitalize('Hello'), 'Hello')
  })
})

describe('comma', () => {
  it('returns comma for non-last items', () => {
    const list = ['a', 'b', 'c']
    assert.strictEqual(comma(0, list), ', ')
    assert.strictEqual(comma(1, list), ', ')
  })

  it('returns empty string for last item', () => {
    const list = ['a', 'b', 'c']
    assert.strictEqual(comma(2, list), '')
  })

  it('returns empty string for null list', () => {
    assert.strictEqual(comma(0, null), '')
  })

  it('uses custom separator', () => {
    const list = ['a', 'b']
    assert.strictEqual(comma(0, list, '; '), '; ')
  })

  it('handles single-item list', () => {
    assert.strictEqual(comma(0, ['a']), '')
  })
})

describe('decoratedNumber', () => {
  it('adds + prefix for positive numbers', () => {
    assert.strictEqual(decoratedNumber(5), '+5')
  })

  it('keeps - prefix for negative numbers', () => {
    assert.strictEqual(decoratedNumber(-3), '-3')
  })

  it('returns +0 for zero', () => {
    assert.strictEqual(decoratedNumber(0), '0')
  })
})
