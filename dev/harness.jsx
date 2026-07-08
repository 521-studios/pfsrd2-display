import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { CreatureStatBlock } from '../src/index.js'
import '../styles/index.css'

const API = '/api/pfsrd2'

class ErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(error) { return { error } }
  componentDidCatch(error, info) { console.error('RENDER ERROR:', error.message, error.stack) }
  render() {
    if (this.state.error) {
      return (
        <div style={{ color: '#f55', padding: 16, fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
          <strong>Render Error:</strong>{'\n'}{this.state.error.message}{'\n'}{this.state.error.stack}
        </div>
      )
    }
    return this.props.children
  }
}

// --- Multipart response parser ---
async function parseMultipartResponse(response) {
  const text = await response.text()
  const boundary = text.split('\n')[0].trim()
  const parts = text.split(boundary)
  let patches = null
  let creature = null

  for (const part of parts) {
    if (part.includes('name="patches"')) {
      const jsonStart = part.indexOf('{')
      const jsonEnd = part.lastIndexOf('}') + 1
      patches = JSON.parse(part.substring(jsonStart, jsonEnd))
    } else if (part.includes('name="creature"')) {
      const jsonStart = part.indexOf('{')
      const jsonEnd = part.lastIndexOf('}') + 1
      creature = JSON.parse(part.substring(jsonStart, jsonEnd))
    }
  }
  return { patches, creature }
}

// --- Search Panel ---
function SearchPanel({ onSelect }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (query.length < 2) {
      setResults([])
      return
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams({ q: query, limit: '15' })
        params.append('type', 'monsters')
        params.append('type', 'npcs')
        const res = await fetch(`${API}/search/suggest/unified?${params}`)
        const data = await res.json()
        setResults(data || [])
      } catch (e) {
        console.error('Search failed:', e)
        setResults([])
      }
      setLoading(false)
    }, 250)
  }, [query])

  return (
    <div style={styles.searchPanel}>
      <div style={styles.searchHeader}>
        <h2 style={{ margin: '0 0 8px' }}>pfsrd2-display</h2>
        <input
          type="text"
          placeholder="Search creatures & NPCs..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={styles.searchInput}
          autoFocus
        />
      </div>
      <div style={styles.resultsList}>
        {loading && <div style={styles.status}>Searching...</div>}
        {!loading && query.length >= 2 && results.length === 0 && (
          <div style={styles.status}>No results</div>
        )}
        {results.map((r) => (
          <SearchResult key={r.game_id} result={r} onSelect={onSelect} />
        ))}
      </div>
    </div>
  )
}

function SearchResult({ result, onSelect }) {
  return (
    <div
      style={styles.resultItem}
      onClick={() => onSelect(result)}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#333')}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
    >
      <div style={styles.resultName}>{result.name}</div>
      <div style={styles.resultMeta}>
        {result.type} {result.level != null ? `· Lvl ${result.level}` : ''}
        {result.edition ? ` · ${result.edition}` : ''}
      </div>
      {result.alternate && (
        <div
          style={styles.alternate}
          onClick={(e) => { e.stopPropagation(); onSelect(result.alternate) }}
        >
          ↔ {result.alternate.name} ({result.alternate.edition})
        </div>
      )}
    </div>
  )
}

// --- Version Picker ---
function VersionPicker({ versions, current, onChange }) {
  if (!versions || versions.length <= 1) return null
  return (
    <div style={styles.versionPicker}>
      {versions.map((v) => (
        <button
          key={v.schema_version}
          onClick={() => onChange(v.schema_version)}
          style={{
            ...styles.versionBtn,
            ...(v.schema_version === current ? styles.versionBtnActive : {}),
          }}
        >
          v{v.schema_version}
        </button>
      ))}
    </div>
  )
}

// --- Template Bar ---
function TemplateBar({ edition, templateStack, onApply, onRemoveLast, onClearAll }) {
  const [allTemplates, setAllTemplates] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        // applicable_to does the edition filtering server-side: entries of
        // the creature's edition, plus other-edition entries with no
        // same-edition counterpart via alternates OR curated equivalents.
        // Unpaired content (Book of the Dead's Wight) still lists for
        // remastered creatures; paired content never double-lists. This
        // replaces client-side name matching, which cannot know about
        // cross-type equivalence pairs (BotD vampire TEMPLATE paired with
        // the Monster Core vampire FAMILY).
        const editionFilter = edition
          ? `&applicable_to=${encodeURIComponent(edition)}`
          : ''
        const pageSize = 20
        let offset = 0
        let all = []
        while (true) {
          const res = await fetch(
            `${API}/search?type=monster_templates&limit=${pageSize}&offset=${offset}${editionFilter}`
          )
          const data = await res.json()
          const results = data.results || []
          all = all.concat(results)
          if (results.length < pageSize || all.length >= data.total) break
          offset += pageSize
        }
        setAllTemplates(all.sort((a, b) => a.name.localeCompare(b.name)))
      } catch (e) {
        console.error('Failed to load templates:', e)
      }
    })()
  }, [edition])

  const templates = allTemplates

  const handleApply = async (template) => {
    setLoading(true)
    try {
      await onApply(template)
    } catch (e) {
      console.error('Template apply failed:', e)
    }
    setLoading(false)
  }

  return (
    <div style={styles.templateBar}>
      <div style={styles.templateRow}>
        <strong style={{ marginRight: 8 }}>Templates:</strong>
        <select
          style={styles.templateSelect}
          onChange={(e) => {
            const t = templates.find((t) => t.game_id === e.target.value)
            if (t) handleApply(t)
            e.target.value = ''
          }}
          disabled={loading}
          defaultValue=""
        >
          <option value="" disabled>
            {loading ? 'Applying...' : '+ Add template'}
          </option>
          {templates.map((t) => (
            <option key={t.game_id} value={t.game_id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {templateStack.length > 0 && (
        <div style={styles.templateStack}>
          {templateStack.map((entry, i) => (
            <span key={i} style={styles.templateTag}>
              {entry.template.name}
              {i === templateStack.length - 1 && (
                <span style={styles.templateRemove} onClick={onRemoveLast}> ×</span>
              )}
            </span>
          ))}
          {templateStack.length > 1 && (
            <span style={styles.templateClearAll} onClick={onClearAll}>Clear all</span>
          )}
        </div>
      )}
    </div>
  )
}

// --- Detail Panel ---

// --- Deep links ---
// Stable URL contract: ?creature=<game_id>&v=<schema_version>&stack=<b64url>
// where stack encodes [{g: template_game_id, s: [SelectionChoice...]}, ...].
// The same state feeds "report a problem" reproduction context.
function encodeStack(templateStack) {
  const entries = templateStack.map((e) => {
    const out = { g: e.template.game_id }
    if (e.selections && e.selections.length > 0) out.s = e.selections
    return out
  })
  const json = JSON.stringify(entries)
  return btoa(String.fromCharCode(...new TextEncoder().encode(json)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeStack(param) {
  try {
    const b64 = param.replace(/-/g, '+').replace(/_/g, '/')
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const entries = JSON.parse(new TextDecoder().decode(bytes))
    return Array.isArray(entries) ? entries : []
  } catch {
    return []
  }
}

function writeDeepLink(selected, schemaVersion, templateStack) {
  const params = new URLSearchParams()
  if (selected) {
    params.set('creature', selected.game_id)
    if (schemaVersion) params.set('v', schemaVersion)
    if (templateStack.length > 0) params.set('stack', encodeStack(templateStack))
  }
  const qs = params.toString()
  window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname)
}

function DetailPanel({ selected, onLoadMonster, initialStack, onInitialStackConsumed }) {
  const [originalCreature, setOriginalCreature] = useState(null)
  const [versions, setVersions] = useState([])
  const [schemaVersion, setSchemaVersion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rolls, setRolls] = useState([])
  const [templateStack, setTemplateStack] = useState([])

  // Fetch entry metadata (versions) when selection changes
  useEffect(() => {
    if (!selected) return
    setVersions([])
    setSchemaVersion(null)
    setTemplateStack([])
    ;(async () => {
      try {
        const res = await fetch(`${API}/entries/${selected.game_id}`)
        const data = await res.json()
        if (data.versions) {
          setVersions(data.versions)
          const prev = schemaVersion
          const match = prev && data.versions.find((v) => v.schema_version === prev)
          setSchemaVersion(match ? prev : data.entry.current_schema_version)
        }
      } catch (e) {
        console.error('Failed to fetch versions:', e)
      }
    })()
  }, [selected])

  // Fetch full creature JSON when version changes
  useEffect(() => {
    if (!selected || !schemaVersion) return
    setLoading(true)
    setError(null)
    setTemplateStack([])
    ;(async () => {
      try {
        const params = new URLSearchParams({ version: schemaVersion })
        const res = await fetch(`${API}/entries/${selected.game_id}/full?${params}`)
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = await res.json()
        setOriginalCreature(data)
      } catch (e) {
        console.error('Failed to fetch creature:', e)
        setError(e.message)
        setOriginalCreature(null)
      }
      setLoading(false)
    })()
  }, [selected, schemaVersion])

  const handleApplyTemplate = useCallback(async (template) => {
    // Use the current creature (last in stack, or original)
    const currentCreature = templateStack.length > 0
      ? templateStack[templateStack.length - 1].creature
      : originalCreature

    // CloudFront OAC with Lambda Function URLs requires the client to provide
    // x-amz-content-sha256 for POST requests — CloudFront does not compute it.
    const applyBody = JSON.stringify({
      creature: currentCreature,
      template_game_id: template.game_id,
    })
    const bodyHash = Array.from(
      new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(applyBody)))
    ).map(b => b.toString(16).padStart(2, '0')).join('')

    // Fetch template application and template full JSON in parallel
    const [applyRes, templateRes] = await Promise.all([
      fetch(`${API}/templates/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-amz-content-sha256': bodyHash,
        },
        body: applyBody,
      }),
      fetch(`${API}/entries/${template.game_id}/full`),
    ])
    if (!applyRes.ok) throw new Error(`Template apply failed: ${applyRes.status}`)

    const { patches, creature } = await parseMultipartResponse(applyRes)
    const templateData = templateRes.ok ? await templateRes.json() : null

    setTemplateStack((prev) => [
      ...prev,
      { template: { game_id: template.game_id, name: template.name }, patches, creature, templateData, selections: [] },
    ])
  }, [originalCreature, templateStack])

  const handleRemoveLast = useCallback(() => {
    setTemplateStack((prev) => prev.slice(0, -1))
  }, [])

  const handleClearAll = useCallback(() => {
    setTemplateStack([])
  }, [])

  const handleRoll = useCallback((rollData) => {
    setRolls((prev) => [{ ...rollData, ts: Date.now() }, ...prev].slice(0, 20))
  }, [])

  // Restore a deep-linked template stack once the base creature is loaded:
  // sequential applies, selections included, then a single stack commit.
  useEffect(() => {
    if (!initialStack || initialStack.length === 0 || !originalCreature) return
    let cancelled = false
    ;(async () => {
      const stack = []
      let current = originalCreature
      for (const entry of initialStack) {
        try {
          const applyBody = JSON.stringify({
            creature: current,
            template_game_id: entry.g,
            selections: entry.s || [],
          })
          const bodyHash = Array.from(
            new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(applyBody)))
          ).map((b) => b.toString(16).padStart(2, '0')).join('')
          const [applyRes, entryRes] = await Promise.all([
            fetch(`${API}/templates/apply`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'x-amz-content-sha256': bodyHash },
              body: applyBody,
            }),
            fetch(`${API}/entries/${entry.g}`),
          ])
          if (!applyRes.ok) throw new Error(`restore apply failed: ${applyRes.status}`)
          const { patches, creature } = await parseMultipartResponse(applyRes)
          const meta = entryRes.ok ? await entryRes.json() : null
          const name = (meta && meta.entry && meta.entry.name) || entry.g
          const tplRes = await fetch(`${API}/entries/${entry.g}/full`)
          const templateData = tplRes.ok ? await tplRes.json() : null
          stack.push({
            template: { game_id: entry.g, name },
            patches,
            creature,
            templateData,
            selections: entry.s || [],
          })
          current = creature
        } catch (e) {
          console.error('Deep-link restore stopped:', e)
          break
        }
      }
      if (!cancelled) {
        setTemplateStack(stack)
        onInitialStackConsumed && onInitialStackConsumed()
      }
    })()
    return () => { cancelled = true }
  }, [initialStack, originalCreature])

  // Keep the URL shareable: creature + schema version + template stack.
  useEffect(() => {
    writeDeepLink(selected, schemaVersion, templateStack)
  }, [selected, schemaVersion, templateStack])

  // Compute the displayed creature and merged patches
  const displayedCreature = templateStack.length > 0
    ? templateStack[templateStack.length - 1].creature
    : originalCreature

  // Merge all patch operations from the stack into one flat array
  const mergedPatches = useMemo(() => {
    if (templateStack.length === 0) return null
    const allGroups = []
    for (const entry of templateStack) {
      if (entry.patches && entry.patches.applied_patches) {
        // carry the source template's name into each group so the display
        // can attribute changes when templates stack
        allGroups.push(
          ...entry.patches.applied_patches.map((g) => ({
            ...g,
            template_name: entry.template.name,
          }))
        )
      }
    }
    return allGroups.length > 0 ? allGroups : null
  }, [templateStack])

  // Collect template full JSON objects for rendering in the stat block
  const appliedTemplates = useMemo(() => {
    if (templateStack.length === 0) return null
    const templates = templateStack
      .map((entry) => entry.templateData)
      .filter(Boolean)
    return templates.length > 0 ? templates : null
  }, [templateStack])

  if (!selected) {
    return (
      <div style={styles.detailPanel}>
        <div style={styles.placeholder}>Search and select a creature</div>
      </div>
    )
  }

  return (
    <div style={styles.detailPanel}>
      <VersionPicker versions={versions} current={schemaVersion} onChange={setSchemaVersion} />
      {loading && <div style={styles.status}>Loading...</div>}
      {error && <div style={{ ...styles.status, color: '#f55' }}>Error: {error}</div>}
      {displayedCreature && (
        <>
          <CopyLinkButton />
          <TemplateBar
            edition={displayedCreature.edition}
            templateStack={templateStack}
            onApply={handleApplyTemplate}
            onRemoveLast={handleRemoveLast}
            onClearAll={handleClearAll}
          />
          <div style={styles.statBlock}>
            <ErrorBoundary>
              <CreatureStatBlock
                data={displayedCreature}
                patches={mergedPatches}
                appliedTemplates={appliedTemplates}
                onRoll={handleRoll}
                onLoadMonster={onLoadMonster}
                imageBaseUrl={`${API}/images`}
              />
            </ErrorBoundary>
          </div>
        </>
      )}
      {rolls.length > 0 && (
        <div style={styles.rollLog}>
          <strong>Roll Log</strong>
          <button
            style={styles.rollLogClear}
            onClick={() => setRolls([])}
            title="Clear the roll log"
          >
            Clear
          </button>
          {rolls.map((r, i) => (
            <div key={r.ts + i} style={styles.rollEntry}>
              <span style={{ color: '#7af' }}>{r.label}</span>
              {r.formula && <span style={{ color: '#aaa' }}> — {r.formula}</span>}
              {r.type === 'complex' && r.structuredFormula && (
                <span style={{ color: '#aaa' }}>
                  {' — '}
                  {r.structuredFormula.formulas
                    .map((f) => f.formula || f.label)
                    .join(' + ')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}


// --- Copy Link ---
function CopyLinkButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      style={styles.copyLink}
      title="Copy a shareable link to this creature with its applied templates"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(window.location.href)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        } catch (e) {
          console.error('clipboard write failed:', e)
        }
      }}
    >
      {copied ? 'Copied!' : 'Copy Link'}
    </button>
  )
}

// --- App ---
function App() {
  const [selected, setSelected] = useState(null)
  const [initialStack, setInitialStack] = useState(null)

  // Deep-link restore: ?creature=<gid>&v=<schema>&stack=<b64url>
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gid = params.get('creature')
    if (!gid) return
    const stackParam = params.get('stack')
    if (stackParam) setInitialStack(decodeStack(stackParam))
    ;(async () => {
      try {
        const res = await fetch(`${API}/entries/${gid}`)
        const data = await res.json()
        setSelected(data.entry ? data.entry : { game_id: gid, name: gid })
      } catch {
        setSelected({ game_id: gid, name: gid })
      }
    })()
  }, [])

  const loadMonster = useCallback((gameId) => {
    setSelected({ game_id: gameId, name: gameId })
  }, [])

  return (
    <>
      <SearchPanel onSelect={setSelected} />
      <DetailPanel
        selected={selected}
        onLoadMonster={loadMonster}
        initialStack={initialStack}
        onInitialStackConsumed={() => setInitialStack(null)}
      />
    </>
  )
}

// --- Styles ---
const styles = {
  searchPanel: {
    width: 320,
    flexShrink: 0,
    borderRight: '1px solid #333',
    display: 'flex',
    flexDirection: 'column',
    background: '#222',
  },
  searchHeader: {
    padding: 12,
    borderBottom: '1px solid #333',
  },
  searchInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #555',
    borderRadius: 4,
    background: '#1a1a1a',
    color: '#e0e0e0',
    fontSize: 14,
    outline: 'none',
  },
  resultsList: {
    flex: 1,
    overflowY: 'auto',
  },
  resultItem: {
    padding: '8px 12px',
    cursor: 'pointer',
    borderBottom: '1px solid #2a2a2a',
  },
  resultName: {
    fontWeight: 'bold',
  },
  resultMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  alternate: {
    fontSize: 12,
    color: '#F79639',
    marginTop: 2,
    cursor: 'pointer',
  },
  detailPanel: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    background: '#222',
  },
  placeholder: {
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
  },
  status: {
    padding: 12,
    color: '#888',
  },
  statBlock: {
    background: '#2a2a2a',
    borderRadius: 6,
    padding: 16,
    marginBottom: 16,
  },
  versionPicker: {
    marginBottom: 12,
    display: 'flex',
    gap: 6,
  },
  versionBtn: {
    padding: '4px 12px',
    border: '1px solid #555',
    borderRadius: 4,
    background: 'transparent',
    color: '#aaa',
    cursor: 'pointer',
    fontSize: 12,
  },
  versionBtnActive: {
    background: '#177ddc',
    color: '#fff',
    borderColor: '#177ddc',
  },
  templateBar: {
    marginBottom: 12,
    padding: '8px 12px',
    background: '#2a2a2a',
    borderRadius: 6,
  },
  templateRow: {
    display: 'flex',
    alignItems: 'center',
  },
  templateSelect: {
    padding: '4px 8px',
    border: '1px solid #555',
    borderRadius: 4,
    background: '#1a1a1a',
    color: '#e0e0e0',
    fontSize: 12,
    cursor: 'pointer',
  },
  templateStack: {
    marginTop: 6,
    display: 'flex',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  templateTag: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '2px 8px',
    background: '#F79639',
    color: '#1a1a1a',
    borderRadius: 3,
    fontSize: 12,
    fontWeight: 'bold',
  },
  templateRemove: {
    marginLeft: 4,
    cursor: 'pointer',
    fontWeight: 'normal',
  },
  templateClearAll: {
    fontSize: 11,
    color: '#888',
    cursor: 'pointer',
    marginLeft: 4,
  },
  copyLink: {
    alignSelf: 'flex-start',
    margin: '8px 12px 0',
    padding: '3px 12px',
    background: '#2a4a6a',
    color: '#dde',
    border: '1px solid #4a6a8a',
    borderRadius: 4,
    cursor: 'pointer',
  },
  rollLogClear: {
    marginLeft: 12,
    padding: '2px 10px',
    background: '#333',
    color: '#ddd',
    border: '1px solid #555',
    borderRadius: 4,
    cursor: 'pointer',
  },
  rollLog: {
    background: '#1a1a1a',
    borderRadius: 6,
    padding: 12,
    fontSize: 12,
    lineHeight: '1.6em',
  },
  rollEntry: {
    borderBottom: '1px solid #2a2a2a',
    padding: '4px 0',
  },
}

createRoot(document.getElementById('root')).render(<App />)
