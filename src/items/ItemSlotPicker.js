import React, { useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Markdown from '../shared/Markdown'
import { formatGp } from '../shared/pf2e'

// ItemSlotPicker is the "customize this item" panel: browse the runes, materials,
// and (for holders) spells that can be applied to an item and apply them, naming
// the result. It is pure presentational UI — the consumer owns the data and the
// calls: pass the `eligibility` response (from fetchEligible), the applied `stack`,
// and wire onApply / onApplySpell (which call applyItemEffect), onRemoveLast /
// onClearAll, and the custom `name` + onNameChange. `searchSpells` is optional and
// only used when the item is a spell holder.
//
// Grouped, always-visible sections (fundamental runes / property runes / materials
// / spells) rather than a flat dropdown, so the GM browses what fits without
// knowing names. A graded rune (grades.length > 1) or a material with several
// grade_prices rows reveals an inline grade step before applying, so nothing is
// applied until a grade is chosen (no wrong-grade flash).
export default function ItemSlotPicker({
  eligibility,
  name = '',
  onNameChange,
  stack = [],
  onApply,
  onApplySpell,
  onRemoveLast,
  onClearAll,
  searchSpells,
  loading = false,
}) {
  if (!eligibility) return null
  const { item, runes, materials, spells } = eligibility
  const fundamental = (runes && runes.fundamental) || []
  const property = (runes && runes.property) || []

  return (
    <div className="ItemSlotPicker" data-testid="item-slot-picker">
      <label className="ItemSlotPicker__name">
        <span className="ItemSlotPicker__name-label">Name</span>
        <input
          className="ItemSlotPicker__name-input"
          data-testid="item-name"
          type="text"
          value={name}
          placeholder={item ? item.name : ''}
          disabled={!onNameChange}
          onChange={(e) => onNameChange && onNameChange(e.target.value)}
        />
      </label>

      <RuneSection title="Fundamental Runes" candidates={fundamental} onApply={onApply} loading={loading} />
      <RuneSection title="Property Runes" candidates={property} onApply={onApply} loading={loading} />
      <MaterialSection materials={materials || []} onApply={onApply} loading={loading} />
      {spells ? (
        <SpellSection spells={spells} searchSpells={searchSpells} onApplySpell={onApplySpell} loading={loading} />
      ) : null}

      {stack.length > 0 && (
        <div className="ItemSlotPicker__stack">
          {stack.map((entry, i) => (
            <span key={i} className="ItemSlotPicker__tag" data-testid="applied-tag">
              {entry.applied}
              {i === stack.length - 1 && (
                <span className="ItemSlotPicker__remove" data-testid="applied-remove" onClick={onRemoveLast}>
                  {' '}×
                </span>
              )}
            </span>
          ))}
          {stack.length > 1 && (
            <span className="ItemSlotPicker__clear" data-testid="applied-clear" onClick={onClearAll}>
              Clear all
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// A group of rune candidates. Non-graded (or single-grade) runes apply on click; a
// multi-grade rune expands an inline grade chooser + Apply.
function RuneSection({ title, candidates, onApply, loading }) {
  if (!candidates || candidates.length === 0) return null
  return (
    <section className="ItemSlotPicker__section">
      <h4 className="ItemSlotPicker__section-title">{title}</h4>
      <ul className="ItemSlotPicker__list">
        {candidates.map((c) => (
          <CandidateRow key={c.game_id} candidate={c} onApply={onApply} loading={loading} />
        ))}
      </ul>
    </section>
  )
}

function CandidateRow({ candidate, onApply, loading }) {
  const grades = candidate.grades || []
  // A rune's grade is its level. Default to the LOWEST level (matching
  // gradeDescriptor's "Item N+"); the grades array isn't assumed sorted.
  const options = grades.map((g) => ({ key: g.level, label: `Item ${g.level}`, price: g.price, grade: g.level }))
  return (
    <GradeStepRow
      id={candidate.game_id}
      name={candidate.name}
      aside={<span className="ItemSlotPicker__item-desc">{gradeDescriptor(grades)}</span>}
      options={options}
      defaultKey={lowestLevel(grades)}
      // A single-grade rune applies with its level; an ungraded one with none.
      onApply={(opt) => onApply(candidate, { grade: opt ? opt.grade : undefined })}
      loading={loading}
    />
  )
}

// GradeStepRow is one applicable row: a direct "Add" when there are 0-1 options,
// or a "Choose grade" step (radios + Apply) when there are several, so nothing is
// applied until a grade is chosen. Shared by runes and materials.
function GradeStepRow({ id, name, aside, options, defaultKey, onApply, loading }) {
  const graded = options.length > 1
  const [open, setOpen] = useState(false)
  const [key, setKey] = useState(graded ? defaultKey : undefined)
  const chosen = options.find((o) => o.key === key)
  // Apply unmounts the radiogroup it sits in, so hand focus back to the toggle
  // rather than dropping it to <body>.
  const toggleRef = useRef(null)

  return (
    <li className="ItemSlotPicker__item">
      <div className="ItemSlotPicker__item-row">
        <span className="ItemSlotPicker__item-name">{name}</span>
        {aside}
        {graded ? (
          <button
            type="button"
            className="ItemSlotPicker__add"
            data-testid="grade-open"
            ref={toggleRef}
            aria-expanded={open}
            disabled={loading}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? 'Cancel' : 'Choose grade'}
          </button>
        ) : (
          <button
            type="button"
            className="ItemSlotPicker__add"
            data-testid="apply-candidate"
            disabled={loading}
            onClick={() => onApply(options[0])}
          >
            Add
          </button>
        )}
      </div>
      {graded && open ? (
        <div className="ItemSlotPicker__grades" role="radiogroup" aria-label={`Grade for ${name}`}>
          {options.map((o) => (
            <label key={o.key} className="ItemSlotPicker__grade">
              <input type="radio" name={`grade-${id}`} checked={key === o.key} onChange={() => setKey(o.key)} />
              <span className="ItemSlotPicker__grade-level">{o.label}</span>
              {o.price ? <span className="ItemSlotPicker__grade-price">{o.price}</span> : null}
            </label>
          ))}
          <button
            type="button"
            className="ItemSlotPicker__apply-grade"
            data-testid="apply-grade"
            disabled={loading || !chosen}
            onClick={() => {
              onApply(chosen)
              setOpen(false)
              if (toggleRef.current) toggleRef.current.focus()
            }}
          >
            Apply
          </button>
        </div>
      ) : null}
    </li>
  )
}

function MaterialSection({ materials, onApply, loading }) {
  if (!materials.length) return null
  return (
    <section className="ItemSlotPicker__section">
      <h4 className="ItemSlotPicker__section-title">Materials</h4>
      <ul className="ItemSlotPicker__list">
        {materials.map((m) => {
          const options = materialGradeOptions(m)
          return (
            <GradeStepRow
              key={m.game_id}
              id={m.game_id}
              name={m.name}
              aside={m.precious ? <span className="ItemSlotPicker__badge">precious</span> : null}
              options={options}
              defaultKey={options.length ? options[0].key : undefined}
              // The consumer gets the chosen grade_prices row (price_cp, cp_per_bulk,
              // form) to price the item; /apply ignores ?grade for materials. No
              // grade_prices (older API) applies ungraded, as before.
              onApply={(opt) => onApply(m, opt ? { grade: opt.grade, gradePrice: opt.row } : {})}
              loading={loading}
            />
          )
        })}
      </ul>
    </section>
  )
}

// materialGradeOptions turns a material's /eligible grade_prices into grade-step
// options, lowest level first: "Standard · Item 11" (or "Standard buckler" for a
// shield form) priced "1,400 gp +140 gp per Bulk".
export function materialGradeOptions(material) {
  const rows = (material && material.grade_prices) || []
  return [...rows]
    .sort((a, b) => (a.level ?? 0) - (b.level ?? 0))
    .map((row) => {
      const grade = row.grade ? row.grade[0].toUpperCase() + row.grade.slice(1) : row.name
      const form = row.form ? ` ${row.form.replace(/_/g, ' ')}` : ''
      const price = [formatGp(row.price_cp), row.per_bulk_text].filter(Boolean).join(' ')
      return {
        key: row.name,
        label: `${grade}${form}${row.level != null ? ` · Item ${row.level}` : ''}`,
        price,
        grade: row.grade,
        row,
      }
    })
}

// The spell slot shows the holder's constraints (the "rules that aren't fields")
// and, for a specialty item, its constraint_text prose. When searchSpells is wired,
// a typeahead lets the GM pick a spell to slot; the apply endpoint enforces the
// rank/type boundary, so an over-rank/cantrip pick is refused server-side.
function SpellSection({ spells, searchSpells, onApplySpell, loading }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const excluded = (spells.excluded_types || []).join(', ')

  const runSearch = async (q) => {
    setQuery(q)
    if (!searchSpells || q.trim().length < 2) { setResults([]); return }
    try { setResults((await searchSpells(q)) || []) } catch { setResults([]) }
  }

  return (
    <section className="ItemSlotPicker__section">
      <h4 className="ItemSlotPicker__section-title">Spell</h4>
      <p className="ItemSlotPicker__constraints" data-testid="spell-constraints">
        Holds a {spells.holder} spell
        {spells.max_rank != null ? ` up to rank ${spells.max_rank}` : ''}
        {excluded ? ` — excludes ${excluded}` : ''}.
      </p>
      {spells.constraint_text ? (
        <div className="ItemSlotPicker__constraint-text">
          <Markdown text={spells.constraint_text} />
        </div>
      ) : null}
      {searchSpells ? (
        <div className="ItemSlotPicker__spell-search">
          <input
            className="ItemSlotPicker__spell-input"
            data-testid="spell-search"
            type="text"
            value={query}
            placeholder="Search a spell…"
            disabled={loading}
            onChange={(e) => runSearch(e.target.value)}
          />
          {results.length > 0 && (
            <ul className="ItemSlotPicker__spell-results">
              {results.map((s) => (
                <li key={s.game_id}>
                  <button
                    type="button"
                    className="ItemSlotPicker__spell-option"
                    data-testid="apply-spell"
                    disabled={loading}
                    onClick={() => { onApplySpell && onApplySpell(s); setQuery(''); setResults([]) }}
                  >
                    {s.name}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  )
}

// lowestLevel is the minimum grade level (the array isn't assumed sorted), or
// undefined when no grade carries a level.
function lowestLevel(grades) {
  const levels = (grades || []).map((g) => g.level).filter((l) => l != null)
  return levels.length ? Math.min(...levels) : undefined
}

// gradeDescriptor summarizes a candidate's grade levels: "Item 2", "Item 2+" for a
// range, or "" when ungraded.
function gradeDescriptor(grades) {
  const min = lowestLevel(grades)
  if (min === undefined) return ''
  return grades.length > 1 ? `Item ${min}+` : `Item ${min}`
}

const candidateShape = PropTypes.shape({
  game_id: PropTypes.string,
  name: PropTypes.string,
  grades: PropTypes.array,
})

ItemSlotPicker.propTypes = {
  eligibility: PropTypes.shape({
    item: PropTypes.object,
    runes: PropTypes.shape({ fundamental: PropTypes.array, property: PropTypes.array }),
    materials: PropTypes.array,
    spells: PropTypes.object,
  }),
  name: PropTypes.string,
  onNameChange: PropTypes.func,
  // stack entries carry at least { applied } — the label from the apply response.
  stack: PropTypes.arrayOf(PropTypes.shape({ applied: PropTypes.string })),
  // (candidate, { grade }) => void. A graded material also passes gradePrice: its chosen
  // /eligible grade_prices row, unchanged (grade, name, level, price_cp, and per-Bulk
  // cp_per_bulk/per_bulk_text or a shield form).
  onApply: PropTypes.func.isRequired,
  onApplySpell: PropTypes.func, // (spell) => void
  onRemoveLast: PropTypes.func,
  onClearAll: PropTypes.func,
  searchSpells: PropTypes.func, // (query) => Promise<[{game_id,name}]>
  loading: PropTypes.bool,
}

RuneSection.propTypes = {
  title: PropTypes.string,
  candidates: PropTypes.arrayOf(candidateShape),
  onApply: PropTypes.func,
  loading: PropTypes.bool,
}
CandidateRow.propTypes = { candidate: candidateShape, onApply: PropTypes.func, loading: PropTypes.bool }
GradeStepRow.propTypes = {
  id: PropTypes.string,
  name: PropTypes.string,
  aside: PropTypes.node,
  options: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.any, label: PropTypes.string, price: PropTypes.string })),
  defaultKey: PropTypes.any,
  onApply: PropTypes.func,
  loading: PropTypes.bool,
}
MaterialSection.propTypes = { materials: PropTypes.array, onApply: PropTypes.func, loading: PropTypes.bool }
SpellSection.propTypes = { spells: PropTypes.object, searchSpells: PropTypes.func, onApplySpell: PropTypes.func, loading: PropTypes.bool }
