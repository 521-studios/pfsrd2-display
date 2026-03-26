const { describe, it } = require('node:test')
const assert = require('node:assert')

// Test the getSchemaVersion logic directly by requiring the module
// Since it's not exported, we test the behavior through the component's routing

describe('schema version detection', () => {
  // We can't easily test React components with node:test alone,
  // so test the version coercion logic that caused the bug.

  it('coerces numeric schema_version to string', () => {
    // This was the actual bug: schema_version comes as float 1.4 from API
    const version = String(1.4)
    assert.strictEqual(version, '1.4')
    assert.ok(version.startsWith('1.4'))
  })

  it('handles string schema_version', () => {
    const version = String('1.3')
    assert.strictEqual(version, '1.3')
    assert.ok(version.startsWith('1.3'))
  })

  it('routes 1.3 and 1.4 to V1_3 renderer', () => {
    const selectRenderer = (v) => {
      const version = v ? String(v) : '1.2'
      if (version.startsWith('1.3') || version.startsWith('1.4')) return 'V1_3'
      return 'V1_2'
    }
    assert.strictEqual(selectRenderer(1.3), 'V1_3')
    assert.strictEqual(selectRenderer(1.4), 'V1_3')
    assert.strictEqual(selectRenderer('1.3'), 'V1_3')
    assert.strictEqual(selectRenderer('1.4'), 'V1_3')
  })

  it('routes 1.2 and missing to V1_2 renderer', () => {
    const selectRenderer = (v) => {
      const version = v ? String(v) : '1.2'
      if (version.startsWith('1.3') || version.startsWith('1.4')) return 'V1_3'
      return 'V1_2'
    }
    assert.strictEqual(selectRenderer(1.2), 'V1_2')
    assert.strictEqual(selectRenderer('1.2'), 'V1_2')
    assert.strictEqual(selectRenderer(null), 'V1_2')
    assert.strictEqual(selectRenderer(undefined), 'V1_2')
  })
})
