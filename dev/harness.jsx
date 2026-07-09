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

  const [selBusy, setSelBusy] = useState(false)
  const handleApplySelections = useCallback(async (choices) => {
    if (templateStack.length === 0) return
    setSelBusy(true)
    try {
      const last = templateStack[templateStack.length - 1]
      const base = templateStack.length > 1
        ? templateStack[templateStack.length - 2].creature
        : originalCreature
      const applyBody = JSON.stringify({
        creature: base,
        template_game_id: last.template.game_id,
        selections: choices,
      })
      const bodyHash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(applyBody)))
      ).map((b) => b.toString(16).padStart(2, '0')).join('')
      const res = await fetch(`${API}/templates/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-amz-content-sha256': bodyHash },
        body: applyBody,
      })
      if (!res.ok) throw new Error(`selections apply failed: ${res.status}`)
      const { patches, creature } = await parseMultipartResponse(res)
      setTemplateStack((prev) => [
        ...prev.slice(0, -1),
        { ...last, patches, creature, selections: choices },
      ])
    } catch (e) {
      console.error('Apply selections failed:', e)
    }
    setSelBusy(false)
  }, [templateStack, originalCreature])

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
  // React runs child effects before parent effects: on first render this
  // fires (selected=null) BEFORE App's mount effect reads the deep-link
  // params — never clobber an unconsumed ?creature= URL.
  useEffect(() => {
    if (!selected && new URLSearchParams(window.location.search).get('creature')) return
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
          <div style={styles.topBar}>
            <ShareLink href={typeof window !== 'undefined' ? window.location.href : ''} />
            <ReportProblem
              creature={displayedCreature}
              creatureGameId={selected && selected.game_id}
              schemaVersion={schemaVersion}
              templateStack={templateStack}
            />
          </div>
          {templateStack.length > 0 && (
            <SelectionsPanel
              key={`${templateStack.length}-${templateStack[templateStack.length - 1].template.game_id}`}
              entry={templateStack[templateStack.length - 1]}
              baseCreature={templateStack.length > 1
                ? templateStack[templateStack.length - 2].creature
                : originalCreature}
              onApplySelections={handleApplySelections}
              busy={selBusy}
            />
          )}
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



// --- Selections Panel ---
// Renders the engine's surfaced selections for the LAST applied template
// (patch doc "selections", engine contract: id + selection {options?,
// min/max?, description?, constraint?}). Structured selects pick option
// indices; descriptor selects (Air's spell swap) build client-computed
// effects: a name-filtered replace of a creature spell with one fetched
// from the API. Applying re-runs the template with the selections payload.
function flattenCreatureSpells(creature) {
  const out = []
  const oas = creature?.stat_block?.offense?.offensive_actions || []
  for (const oa of oas) {
    const lists = oa.spells?.spell_list || []
    for (const lvl of lists) {
      for (const sp of lvl.spells || []) {
        out.push({ name: sp.name, level: lvl.level, level_text: lvl.level_text })
      }
    }
  }
  return out
}

function SpellSwapBuilder({ baseCreature, onAdd }) {
  const [fromSpell, setFromSpell] = useState('')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const spells = useMemo(() => flattenCreatureSpells(baseCreature), [baseCreature])

  useEffect(() => {
    if (query.length < 2) { setResults([]); return }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/search?type=spells&q=${encodeURIComponent(query)}&limit=8`)
        const data = await res.json()
        setResults(data.results || [])
      } catch { setResults([]) }
    }, 250)
    return () => clearTimeout(t)
  }, [query])

  if (spells.length === 0) return <div style={styles.selectionNote}>Creature has no spells to swap.</div>

  return (
    <div style={styles.spellSwap}>
      <select style={styles.templateSelect} value={fromSpell} onChange={(e) => setFromSpell(e.target.value)}>
        <option value="">— spell to replace —</option>
        {spells.map((sp, i) => (
          <option key={i} value={sp.name}>{sp.name} ({sp.level_text || sp.level})</option>
        ))}
      </select>
      <input
        style={styles.spellSearch}
        placeholder="replacement spell…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {results.map((r) => (
        <button
          key={r.game_id}
          style={styles.spellResult}
          onClick={() => {
            if (!fromSpell) return
            // name-filtered object replace inside the creature's spell lists
            onAdd({
              operation: 'replace',
              target: `$.offense.offensive_actions[*].spells.spell_list[*].spells[?(@.name=='${fromSpell.replace(/'/g, "\\'")}')]`,
              value: {
                name: r.name,
                subtype: 'spell',
                type: 'stat_block_section',
                links: [{ name: r.name, alt: r.name, aonid: r.aonid, 'game-obj': 'Spells', type: 'link' }],
              },
            }, `${fromSpell} → ${r.name}`)
            setFromSpell(''); setQuery(''); setResults([])
          }}
        >
          {r.name}{r.level != null ? ` (rank ${r.level})` : ''}
        </button>
      ))}
    </div>
  )
}

function SelectionsPanel({ entry, baseCreature, onApplySelections, busy }) {
  const selections = (entry && entry.patches && entry.patches.selections) || []
  const [picks, setPicks] = useState({})       // id -> Set(option index)
  const [swaps, setSwaps] = useState({})       // id -> [{effect, label}]
  if (selections.length === 0) return null

  const toggle = (id, idx, max) => {
    setPicks((prev) => {
      const cur = new Set(prev[id] || [])
      if (cur.has(idx)) cur.delete(idx)
      else {
        if (max && cur.size >= max) return prev
        cur.add(idx)
      }
      return { ...prev, [id]: cur }
    })
  }

  const buildChoices = () => {
    const choices = []
    for (const sel of selections) {
      const idxs = [...(picks[sel.id] || [])]
      const effs = (swaps[sel.id] || []).map((s) => s.effect)
      if (idxs.length || effs.length) {
        const c = { id: sel.id }
        if (idxs.length) c.option_indices = idxs.sort((a, b) => a - b)
        if (effs.length) c.effects = effs
        choices.push(c)
      }
    }
    return choices
  }

  const anyChosen = selections.some((sel) => (picks[sel.id] || new Set()).size > 0 || (swaps[sel.id] || []).length > 0)

  return (
    <div style={styles.selectionsPanel}>
      <strong>Selections — {entry.template.name}</strong>
      {selections.map((sel) => {
        const opts = sel.selection?.options || []
        const max = sel.selection?.max
        const min = sel.selection?.min
        return (
          <div key={sel.id} style={styles.selectionBlock}>
            <div style={styles.selectionDesc}>
              {sel.selection?.description || sel.selection?.action || sel.change_category}
              {sel.selection?.constraint ? ` — ${sel.selection.constraint}` : ''}
              {min || max ? ` (choose ${min === max ? min : `${min || 0}–${max}`})` : ''}
            </div>
            {opts.length > 0 ? (
              opts.map((opt, i) => (
                <label key={i} style={styles.selectionOption}>
                  <input
                    type="checkbox"
                    checked={(picks[sel.id] || new Set()).has(i)}
                    onChange={() => toggle(sel.id, i, max)}
                  />{' '}
                  {opt.name || (opt.item && opt.item.name) || (opt.effects && opt.effects[0]?.item?.name) || `Option ${i + 1}`}
                </label>
              ))
            ) : (
              <>
                <SpellSwapBuilder
                  baseCreature={baseCreature}
                  onAdd={(effect, label) =>
                    setSwaps((prev) => ({ ...prev, [sel.id]: [...(prev[sel.id] || []), { effect, label }] }))
                  }
                />
                {(swaps[sel.id] || []).map((sw, i) => (
                  <div key={i} style={styles.selectionNote}>
                    {sw.label}{' '}
                    <button
                      style={styles.rollLogClear}
                      onClick={() => setSwaps((prev) => ({ ...prev, [sel.id]: prev[sel.id].filter((_, j) => j !== i) }))}
                    >
                      remove
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )
      })}
      <button
        style={styles.copyLink}
        disabled={!anyChosen || busy}
        onClick={() => onApplySelections(buildChoices())}
      >
        {busy ? 'Applying…' : 'Apply Selections'}
      </button>
    </div>
  )
}


// --- Report a Problem ---
// Files a defect with the full reproduction context pre-filled from the
// deep-link state (creature + schema + template stack + selections): the
// released user only types what's wrong. POST /defects (engine contract,
// wyrd pattern) — accepted defects are replayable by triage.
function ReportProblem({ creature, creatureGameId, schemaVersion, templateStack }) {
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [flaggedPath, setFlaggedPath] = useState('')
  const [state, setState] = useState(null) // null | 'sending' | {id} | {error}

  if (!creature) return null

  const submit = async () => {
    setState('sending')
    try {
      const body = JSON.stringify({
        reason,
        // entry metadata game_id is always present; the full doc's
        // "game-id" is a fallback (older schema versions may lack it)
        creature_game_id: creatureGameId || creature['game-id'] || creature.game_id || '',
        creature_name: creature.name,
        edition: creature.edition,
        schema_version: String(schemaVersion || ''),
        flagged_path: flaggedPath,
        template_stack: templateStack.map((e) => {
          const out = { g: e.template.game_id }
          if (e.selections && e.selections.length > 0) out.s = e.selections
          return out
        }),
      })
      const bodyHash = Array.from(
        new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body)))
      ).map((b) => b.toString(16).padStart(2, '0')).join('')
      const res = await fetch(`${API}/defects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-amz-content-sha256': bodyHash },
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `${res.status}`)
      setState({ id: data.id })
      setReason('')
      setFlaggedPath('')
    } catch (e) {
      setState({ error: String(e.message || e) })
    }
  }

  return (
    <div style={styles.reportBox}>
      <button style={{ ...styles.reportButton, marginTop: 0 }} onClick={() => { setOpen(!open); setState(null) }}>
        {open ? 'Cancel report' : 'Report a problem'}
      </button>
      {open && (
        <div style={styles.reportForm}>
          <div style={styles.selectionNote}>
            Reporting on <strong>{creature.name}</strong>
            {templateStack.length > 0
              ? ` with ${templateStack.map((e) => e.template.name).join(' + ')}`
              : ''} — the full reproduction context is attached automatically.
          </div>
          <textarea
            style={styles.reportReason}
            placeholder="What's wrong? (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
          />
          <input
            style={styles.spellSearch}
            placeholder="which stat/section? (optional)"
            value={flaggedPath}
            onChange={(e) => setFlaggedPath(e.target.value)}
          />
          <button
            style={styles.copyLink}
            disabled={!reason.trim() || state === 'sending'}
            onClick={submit}
          >
            {state === 'sending' ? 'Sending…' : 'Submit report'}
          </button>
          {state && state.id && (
            <div style={{ color: '#7c7' }}>Thanks — filed as {state.id}</div>
          )}
          {state && state.error && (
            <div style={{ color: '#f66' }}>Failed: {state.error}</div>
          )}
        </div>
      )}
    </div>
  )
}

// --- Share link (GitHub-style: readonly URL input + adjacent copy button) ---
function ShareLink({ href }) {
  const [copied, setCopied] = useState(false)
  return (
    <span style={styles.shareGroup}>
      <input
        style={styles.shareInput}
        readOnly
        value={href}
        onFocus={(e) => e.target.select()}
        aria-label="Shareable link"
      />
      <button
        style={styles.shareCopy}
        title="Copy link"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(href)
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          } catch (e) {
            console.error('clipboard write failed:', e)
          }
        }}
      >
        {copied ? '✓' : '⧉'}
      </button>
    </span>
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
  reportBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  topBar: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 12,
    margin: '8px 12px 0',
  },
  shareGroup: { display: 'inline-flex', alignItems: 'stretch' },
  shareInput: {
    width: 320,
    padding: '4px 8px',
    background: '#1a1a1f',
    color: '#bbb',
    border: '1px solid #555',
    borderRight: 'none',
    borderRadius: '4px 0 0 4px',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  shareCopy: {
    padding: '0 10px',
    background: '#333',
    color: '#ddd',
    border: '1px solid #555',
    borderRadius: '0 4px 4px 0',
    cursor: 'pointer',
  },
  reportButton: {
    padding: '3px 12px',
    background: '#5a2a2a',
    color: '#edd',
    border: '1px solid #8a4a4a',
    borderRadius: 4,
    cursor: 'pointer',
    marginTop: 8,
  },
  reportForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
    padding: '8px 0',
    maxWidth: 480,
  },
  reportReason: {
    padding: '6px 8px',
    background: '#1a1a1f',
    color: '#ddd',
    border: '1px solid #555',
    borderRadius: 4,
    fontFamily: 'inherit',
  },
  selectionsPanel: {
    margin: '8px 12px',
    padding: '8px 12px',
    background: '#26212b',
    border: '1px solid #4a3a5a',
    borderRadius: 6,
  },
  selectionBlock: { margin: '8px 0' },
  selectionDesc: { color: '#caa', marginBottom: 4 },
  selectionOption: { display: 'block', margin: '2px 0 2px 12px', cursor: 'pointer' },
  selectionNote: { color: '#998', margin: '4px 0 4px 12px' },
  spellSwap: { display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', margin: '4px 0 4px 12px' },
  spellSearch: {
    padding: '4px 8px',
    background: '#1a1a1f',
    color: '#ddd',
    border: '1px solid #555',
    borderRadius: 4,
  },
  spellResult: {
    padding: '2px 10px',
    background: '#2a4a3a',
    color: '#dfd',
    border: '1px solid #4a6a5a',
    borderRadius: 4,
    cursor: 'pointer',
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
