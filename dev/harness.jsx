import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { CreatureStatBlock } from '../src/index.js'
import Markdown from '../src/shared/Markdown'
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

  // Monotonic sequence: only the latest in-flight selections apply may
  // commit. Stack mutations (template apply/remove, creature or version
  // change) bump it too, so a late response can never overwrite a newer
  // stack. Every setTemplateStack reset below bumps this.
  const selSeq = useRef(0)

  // Fetch entry metadata (versions) when selection changes
  useEffect(() => {
    if (!selected) return
    setVersions([])
    setSchemaVersion(null)
    selSeq.current++
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
    selSeq.current++
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
    selSeq.current++ // invalidate in-flight selection applies
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

    selSeq.current++ // invalidate selections applies raced against this push
    setTemplateStack((prev) => [
      ...prev,
      { template: { game_id: template.game_id, name: template.name }, patches, creature, templateData, selections: [] },
    ])
  }, [originalCreature, templateStack])

  const handleRemoveLast = useCallback(() => {
    selSeq.current++
    setTemplateStack((prev) => prev.slice(0, -1))
  }, [])

  const [selBusy, setSelBusy] = useState(false)
  const [selError, setSelError] = useState(null)
  // Busy/error belong to the LATEST selections apply only — selApplyToken
  // is bumped solely here, so a stale response (invalidated by a stack
  // mutation) still clears the spinner unless a newer apply owns it.
  const selApplyToken = useRef(0)
  const handleApplySelections = useCallback(async (choices) => {
    if (templateStack.length === 0) return
    const seq = ++selSeq.current
    const token = ++selApplyToken.current
    setSelBusy(true)
    setSelError(null)
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
      if (seq !== selSeq.current) {
        if (token === selApplyToken.current) setSelBusy(false)
        return
      }
      if (!res.ok) {
        let reason = `apply failed: ${res.status}`
        try {
          const body = await res.json()
          if (body && body.error) reason = body.error
        } catch { /* non-JSON error body */ }
        throw new Error(reason)
      }
      const { patches, creature } = await parseMultipartResponse(res)
      if (seq !== selSeq.current) {
        if (token === selApplyToken.current) setSelBusy(false)
        return
      }
      setTemplateStack((prev) => {
        // identity guard: if the tail is no longer the entry this apply
        // started from (template pushed/removed meanwhile), drop the result
        if (prev.length === 0 || prev[prev.length - 1] !== last) return prev
        return [...prev.slice(0, -1), { ...last, patches, creature, selections: choices }]
      })
    } catch (e) {
      console.error('Apply selections failed:', e)
      if (seq === selSeq.current && token === selApplyToken.current) setSelError(String(e.message || e))
    }
    if (token === selApplyToken.current) setSelBusy(false)
  }, [templateStack, originalCreature])

  const handleClearAll = useCallback(() => {
    selSeq.current++
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
        selSeq.current++
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
              error={selError}
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
  // Heightened cantrips share the numeric level of their heightening
  // ("Cantrips (5th)" carries level: 5) — group by level_text so cantrips
  // form their own rank entry, and searches for their replacements use
  // rank 0 (cantrip-rank air spells like Gale Blast).
  const out = []
  const oas = creature?.stat_block?.offense?.offensive_actions || []
  for (const oa of oas) {
    const lists = oa.spells?.spell_list || []
    for (const lvl of lists) {
      const isCantrip = /\(/.test(lvl.level_text || '')
      for (const sp of lvl.spells || []) {
        out.push({
          name: sp.name,
          level: lvl.level,
          level_text: lvl.level_text,
          group: isCantrip ? `cantrip` : `rank${lvl.level}`,
          searchRank: isCantrip ? 0 : lvl.level,
          label: isCantrip ? `Cantrips ${lvl.level_text}` : `Rank ${lvl.level}`,
        })
      }
    }
  }
  return out
}

function SpellSwapBuilder({ baseCreature, selection, edition, swapped, onAdd }) {
  // Published constraint: replace spells with <trait> spells OF THE SAME
  // RANK ("air spells", "water spells"...). Flow: pick the rank, pick the
  // creature's spell at that rank (sorted), pick a replacement from the
  // trait+rank-filtered list (type-to-filter dropdown via datalist).
  const [rank, setRank] = useState('')
  const [fromSpell, setFromSpell] = useState('')
  const [replacement, setReplacement] = useState('')
  const [options, setOptions] = useState([])

  // The engine surfaces the swap constraint structurally: selection.constraint
  // is the required trait ("air"). Older data without the field falls back
  // to parsing the LAST "with <x> spells" qualifier from the description.
  const descMatches = [...(selection?.description || '').matchAll(/\bwith ([a-z]+) spells\b/gi)]
  const rawTrait = selection?.constraint
    || (descMatches.length ? descMatches[descMatches.length - 1][1] : null)
  const trait = rawTrait ? rawTrait[0].toUpperCase() + rawTrait.slice(1).toLowerCase() : null

  const creatureSpells = useMemo(() => flattenCreatureSpells(baseCreature), [baseCreature])
  const ranks = useMemo(() => {
    const seen = new Map()
    for (const sp of creatureSpells) {
      if (!seen.has(sp.group)) seen.set(sp.group, { group: sp.group, label: sp.label, searchRank: sp.searchRank })
    }
    return [...seen.values()].sort((a, b) => a.searchRank - b.searchRank)
  }, [creatureSpells])
  const rankEntry = ranks.find((r) => r.group === rank)
  const spellsAtRank = useMemo(
    () => creatureSpells
      .filter((sp) => sp.group === rank)
      // a spell already swapped out this round can't be swapped again
      .filter((sp) => !(swapped || []).includes(sp.name))
      .sort((a, b) => a.name.localeCompare(b.name)),
    [creatureSpells, rank, swapped]
  )

  // trait + rank + edition filtered replacement list, sorted by name
  useEffect(() => {
    if (!rankEntry || !trait) { setOptions([]); return }
    let cancelled = false
    ;(async () => {
      try {
        const params = new URLSearchParams({
          type: 'spells', traits: trait, level: String(rankEntry.searchRank), limit: '100',
        })
        if (edition) params.set('edition', edition)
        const res = await fetch(`${API}/search?${params}`)
        const data = await res.json()
        if (!cancelled) {
          setOptions((data.results || []).sort((a, b) => a.name.localeCompare(b.name)))
        }
      } catch { if (!cancelled) setOptions([]) }
    })()
    return () => { cancelled = true }
  }, [rankEntry && rankEntry.group, trait, edition])

  if (creatureSpells.length === 0) {
    return <div style={styles.selectionNote}>Creature has no spells to swap.</div>
  }
  if (!trait) {
    return <div style={styles.selectionNote}>Free-form selection — no trait constraint recognized.</div>
  }

  const addSwap = () => {
    const chosen = options.find((o) => o.name.toLowerCase() === replacement.trim().toLowerCase())
    if (!fromSpell || !chosen) return
    // The engine owns swap semantics: it validates trait + rank and builds
    // the replacement entry. The client sends only names and ids.
    onAdd(
      { from: fromSpell, replacement_game_id: chosen.game_id },
      `${fromSpell} → ${chosen.name.toLowerCase()} (${rankEntry ? rankEntry.label : rank})`,
      fromSpell
    )
    setFromSpell(''); setReplacement('')
  }

  return (
    <div style={styles.spellSwap}>
      <select style={styles.templateSelect} value={rank}
        onChange={(e) => { setRank(e.target.value); setFromSpell(''); setReplacement('') }}>
        <option value="">— rank —</option>
        {ranks.map((r) => (
          <option key={r.group} value={r.group}>{r.label}</option>
        ))}
      </select>
      <select style={styles.templateSelect} value={fromSpell} disabled={rank === ''}
        onChange={(e) => setFromSpell(e.target.value)}>
        <option value="">— spell to replace —</option>
        {spellsAtRank.map((sp, i) => (
          <option key={i} value={sp.name}>{sp.name}</option>
        ))}
      </select>
      <SpellCombobox
        options={options}
        value={replacement}
        disabled={rank === ''}
        placeholder={!rankEntry ? 'pick a rank first' : `${trait.toLowerCase()} spells — ${rankEntry.label.toLowerCase()}…`}
        onChange={setReplacement}
      />
      <button
        style={styles.spellResult}
        disabled={!fromSpell || !options.some((o) => o.name.toLowerCase() === replacement.trim().toLowerCase())}
        onClick={addSwap}
      >
        Add swap
      </button>
    </div>
  )
}


// Combobox styled like a native select: click/focus opens the full sorted
// list, typing filters it, arrows + Enter or click choose, Escape closes.
// A typed exact match commits on Enter or when focus leaves. (The native
// <datalist> renders inconsistently and gives no dropdown affordance.)
function SpellCombobox({ options, value, disabled, placeholder, onChange }) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [active, setActive] = useState(-1)
  const boxRef = useRef(null)

  const shown = options.filter((o) =>
    o.name.toLowerCase().includes((open ? filter : '').toLowerCase()))

  const commit = (name) => {
    onChange(name)
    setOpen(false)
    setActive(-1)
  }

  // Closing without an explicit pick keeps a typed exact match
  const settle = () => {
    const exact = options.find((o) => o.name.toLowerCase() === filter.trim().toLowerCase())
    if (exact) onChange(exact.name)
    setOpen(false)
    setActive(-1)
  }

  useEffect(() => {
    if (!open) return
    const close = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) settle()
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  })

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (!open) setOpen(true)
      else setActive((a) => Math.min(a + 1, shown.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((a) => Math.max(a - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (open && active >= 0 && shown[active]) commit(shown[active].name)
      else if (open) settle()
    } else if (e.key === 'Escape') {
      setOpen(false)
      setActive(-1)
    }
  }

  return (
    <span ref={boxRef} style={styles.comboWrap}>
      <input
        style={styles.comboInput}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        disabled={disabled}
        placeholder={placeholder}
        value={open ? filter : value}
        onFocus={() => { setOpen(true); setFilter(''); setActive(-1) }}
        onBlur={(e) => {
          if (boxRef.current && !boxRef.current.contains(e.relatedTarget)) settle()
        }}
        onChange={(e) => { setFilter(e.target.value); setOpen(true); setActive(-1) }}
        onKeyDown={onKeyDown}
      />
      <span style={styles.comboArrow}>▾</span>
      {open && !disabled && (
        <div style={styles.comboList} role="listbox">
          {shown.length === 0 && <div style={styles.comboEmpty}>no matches</div>}
          {shown.map((o, i) => (
            <div
              key={o.game_id}
              role="option"
              aria-selected={i === active}
              style={i === active
                ? { ...styles.comboOption, background: '#3d3d46' }
                : styles.comboOption}
              onMouseEnter={() => setActive(i)}
              onMouseDown={() => commit(o.name)}
            >
              {o.name}
            </div>
          ))}
        </div>
      )}
    </span>
  )
}

function SelectionsPanel({ entry, baseCreature, onApplySelections, busy, error }) {
  const selections = (entry && entry.patches && entry.patches.selections) || []
  const [picks, setPicks] = useState({})       // id -> Set(option index)
  const [swaps, setSwaps] = useState({})       // id -> [{swap, label, from}]

  // Deep-link restore: the stack entry carries applied selections but the
  // panel starts empty — without rehydration the first live-apply after a
  // restore would silently wipe them. Seed once per entry when local state
  // is empty. Legacy entries carrying raw effects can't be rebuilt into
  // chips; they are left applied and untouched.
  useEffect(() => {
    if (Object.keys(picks).length || Object.keys(swaps).length) return
    const restored = entry && entry.selections
    if (!restored || !restored.length) return
    const nextPicks = {}
    const nextSwaps = {}
    for (const c of restored) {
      if (c.option_indices && c.option_indices.length) nextPicks[c.id] = new Set(c.option_indices)
      if (c.spell_swaps && c.spell_swaps.length) {
        nextSwaps[c.id] = c.spell_swaps.map((sw) => ({
          swap: sw, from: sw.from, label: `${sw.from} → (restored swap)`,
        }))
      }
    }
    if (Object.keys(nextPicks).length) setPicks(nextPicks)
    if (Object.keys(nextSwaps).length) setSwaps(nextSwaps)
  }, [entry])

  if (selections.length === 0) return null

  // Selections apply LIVE: every pick toggle and swap add/remove re-applies
  // the template immediately, so the stat block always reflects the panel.
  // (A separate "apply" click proved to be a UX trap — swaps looked added
  // but the stat block never changed until the extra click.)
  const buildChoicesFrom = (picksV, swapsV) => {
    const choices = []
    for (const sel of selections) {
      const idxs = [...(picksV[sel.id] || [])]
      const sws = (swapsV[sel.id] || []).map((s) => s.swap)
      if (idxs.length || sws.length) {
        const c = { id: sel.id }
        if (idxs.length) c.option_indices = idxs.sort((a, b) => a - b)
        if (sws.length) c.spell_swaps = sws
        choices.push(c)
      }
    }
    return choices
  }

  const toggle = (id, idx, max) => {
    const cur = new Set(picks[id] || [])
    if (cur.has(idx)) cur.delete(idx)
    else {
      if (max && cur.size >= max) return
      cur.add(idx)
    }
    const next = { ...picks, [id]: cur }
    setPicks(next)
    onApplySelections(buildChoicesFrom(next, swaps))
  }

  const addSwap = (id, record) => {
    const next = { ...swaps, [id]: [...(swaps[id] || []), record] }
    setSwaps(next)
    onApplySelections(buildChoicesFrom(picks, next))
  }

  const removeSwap = (id, i) => {
    const next = { ...swaps, [id]: swaps[id].filter((_, j) => j !== i) }
    setSwaps(next)
    onApplySelections(buildChoicesFrom(picks, next))
  }

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
              <Markdown text={[
                sel.selection?.description || sel.selection?.action || sel.change_category,
                sel.selection?.constraint ? `— ${sel.selection.constraint}` : '',
                min || max ? `*(choose ${min === max ? min : `${min || 0}–${max}`})*` : '',
              ].filter(Boolean).join(' ')} />
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
                  selection={sel.selection}
                  edition={baseCreature && baseCreature.edition}
                  swapped={(swaps[sel.id] || []).map((sw) => sw.from)}
                  onAdd={(swap, label, from) => addSwap(sel.id, { swap, label, from })}
                />
                {(swaps[sel.id] || []).map((sw, i) => (
                  <div key={i} style={styles.selectionNote}>
                    {sw.label}{' '}
                    <button
                      style={styles.rollLogClear}
                      onClick={() => removeSwap(sel.id, i)}
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
      {busy ? <div style={styles.selectionNote}>Applying…</div> : null}
      {!busy && error ? (
        <div style={{ ...styles.selectionNote, color: '#e07070' }}>
          Failed: {error} — the stat block was not changed; remove or fix the offending choice.
        </div>
      ) : null}
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
  comboWrap: { position: 'relative', display: 'inline-block' },
  comboInput: {
    padding: '4px 26px 4px 8px',
    background: '#2a2a30',
    color: '#ddd',
    border: '1px solid #555',
    borderRadius: 4,
    minWidth: 240,
    cursor: 'pointer',
  },
  comboArrow: {
    position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
    pointerEvents: 'none', color: '#999', fontSize: 11,
  },
  comboList: {
    position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 30,
    maxHeight: 220, overflowY: 'auto',
    background: '#2a2a30', border: '1px solid #555', borderRadius: 4,
    boxShadow: '0 4px 12px rgba(0,0,0,.5)',
  },
  comboOption: { padding: '5px 10px', cursor: 'pointer', borderBottom: '1px solid #3a3a40' },
  comboEmpty: { padding: '5px 10px', color: '#888' },
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
