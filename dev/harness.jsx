import React, { useState, useEffect, useRef, useCallback } from 'react'
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
        const params = new URLSearchParams({
          q: query,
          type: 'monsters',
          limit: '15',
        })
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
          placeholder="Search creatures..."
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
          onClick={(e) => {
            e.stopPropagation()
            onSelect(result.alternate)
          }}
        >
          ↔ {result.alternate.name} ({result.alternate.edition})
        </div>
      )}
    </div>
  )
}

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

function DetailPanel({ selected, onLoadMonster }) {
  const [creature, setCreature] = useState(null)
  const [versions, setVersions] = useState([])
  const [schemaVersion, setSchemaVersion] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [rolls, setRolls] = useState([])

  // Fetch entry metadata (versions) when selection changes
  useEffect(() => {
    if (!selected) return
    setVersions([])
    setSchemaVersion(null)
    ;(async () => {
      try {
        const res = await fetch(`${API}/entries/${selected.game_id}`)
        const data = await res.json()
        if (data.versions) {
          setVersions(data.versions)
          // If we already had a version selected, try to keep it
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
    ;(async () => {
      try {
        const params = new URLSearchParams({ version: schemaVersion })
        const res = await fetch(
          `${API}/entries/${selected.game_id}/full?${params}`
        )
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
        const data = await res.json()
        setCreature(data)
      } catch (e) {
        console.error('Failed to fetch creature:', e)
        setError(e.message)
        setCreature(null)
      }
      setLoading(false)
    })()
  }, [selected, schemaVersion])

  const handleRoll = useCallback((rollData) => {
    setRolls((prev) => [{ ...rollData, ts: Date.now() }, ...prev].slice(0, 20))
  }, [])

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
      {creature && (
        <div style={styles.statBlock}>
          <ErrorBoundary>
            <CreatureStatBlock
              data={creature}
              onRoll={handleRoll}
              onLoadMonster={onLoadMonster}
              imageBaseUrl={`${API}/images`}
            />
          </ErrorBoundary>
        </div>
      )}
      {rolls.length > 0 && (
        <div style={styles.rollLog}>
          <strong>Roll Log</strong>
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

function App() {
  const [selected, setSelected] = useState(null)

  // Load a monster by game_id (used by onLoadMonster callback from stat block)
  const loadMonster = useCallback((gameId) => {
    setSelected({ game_id: gameId, name: gameId })
  }, [])

  return (
    <>
      <SearchPanel onSelect={setSelected} />
      <DetailPanel selected={selected} onLoadMonster={loadMonster} />
    </>
  )
}

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
