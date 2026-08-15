import React, { useState } from 'react'
import PropTypes from 'prop-types'
import Markdown from '../shared/Markdown'

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
// knowing names. A graded rune (grades.length > 1) reveals an inline grade step
// before applying — nothing is applied until a grade is chosen (no wrong-grade flash).
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
  const graded = grades.length > 1
  const [open, setOpen] = useState(false)
  // Default the grade step to the lowest grade (the endpoint's grade<=0 default).
  const [grade, setGrade] = useState(graded ? grades[0].level : undefined)

  const apply = (level) => onApply(candidate, { grade: level })

  return (
    <li className="ItemSlotPicker__item">
      <div className="ItemSlotPicker__item-row">
        <span className="ItemSlotPicker__item-name">{candidate.name}</span>
        <span className="ItemSlotPicker__item-desc">{gradeDescriptor(grades)}</span>
        {graded ? (
          <button
            type="button"
            className="ItemSlotPicker__add"
            data-testid="grade-open"
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
            onClick={() => apply(grades.length === 1 ? grades[0].level : undefined)}
          >
            Add
          </button>
        )}
      </div>
      {graded && open ? (
        <div className="ItemSlotPicker__grades" role="radiogroup" aria-label={`Grade for ${candidate.name}`}>
          {grades.map((g) => (
            <label key={g.level} className="ItemSlotPicker__grade">
              <input
                type="radio"
                name={`grade-${candidate.game_id}`}
                checked={grade === g.level}
                onChange={() => setGrade(g.level)}
              />
              <span className="ItemSlotPicker__grade-level">Item {g.level}</span>
              {g.price ? <span className="ItemSlotPicker__grade-price">{g.price}</span> : null}
            </label>
          ))}
          <button
            type="button"
            className="ItemSlotPicker__apply-grade"
            data-testid="apply-grade"
            disabled={loading}
            onClick={() => { apply(grade); setOpen(false) }}
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
        {materials.map((m) => (
          <li key={m.game_id} className="ItemSlotPicker__item">
            <div className="ItemSlotPicker__item-row">
              <span className="ItemSlotPicker__item-name">{m.name}</span>
              {m.precious ? <span className="ItemSlotPicker__badge">precious</span> : null}
              <button
                type="button"
                className="ItemSlotPicker__add"
                data-testid="apply-candidate"
                disabled={loading}
                onClick={() => onApply(m, {})}
              >
                Add
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
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

// gradeDescriptor summarizes a candidate's grade levels: "Item 2", "Item 2+" for a
// range, or "" when ungraded.
function gradeDescriptor(grades) {
  if (!grades || grades.length === 0) return ''
  const levels = grades.map((g) => g.level).filter((l) => l != null)
  if (levels.length === 0) return ''
  const min = Math.min(...levels)
  return levels.length > 1 ? `Item ${min}+` : `Item ${min}`
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
  onApply: PropTypes.func.isRequired, // (candidate, { grade }) => void
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
MaterialSection.propTypes = { materials: PropTypes.array, onApply: PropTypes.func, loading: PropTypes.bool }
SpellSection.propTypes = { spells: PropTypes.object, searchSpells: PropTypes.func, onApplySpell: PropTypes.func, loading: PropTypes.bool }
