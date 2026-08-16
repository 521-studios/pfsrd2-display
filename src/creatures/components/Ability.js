import React, { useState } from 'react'
import Action from './Action'
import Modifiers from './Modifiers'
import Changed from '../../shared/Changed'
import UMAExpansion from '../../shared/UMAExpansion'
import Markdown from '../../shared/Markdown'

const Ability = (props) => {
  const { ability, i, basePath } = props
  const [umaExpanded, setUmaExpanded] = useState(false)

  if (!ability) { return null }

  // A trailing "." goes before the ability text iff a stat line rendered — i.e. any of
  // area (non-empty) / range / saving_throw / damage is present. Derived, not set as a
  // side effect of the stat-line renderers (2ne).
  const period =
    (ability.area && ability.area.length > 0) || ability.range || ability.saving_throw || ability.damage
      ? '.'
      : ''

  const renderAction = (ability) => {
    const action = ability.action_type || ability.action
    if (!action) { return null }
    return (
      <span>
        {' '}
        <Action name={action.name} />
      </span>)
  }

  const renderTraits = (ability) => {
    if (!ability.traits) { return null }
    return (
      <span>
        {' '}
        ({ability.traits.map((trait, i) => trait.value ?
          `${trait.name} ${trait.value}` : trait.name).join(', ')
        })
      </span>
    )
  }

  const renderRange = (ability) => {
    if (!ability.range) { return null }
    const r = ability.range
    const display = r.touch ? 'touch' : r.text || `${r.range} ${r.unit}`
    return (
      <span>
        {' '}
        <strong className="Monster__ability-label">Range</strong>
        {' '}
        <span>{display}<Modifiers modifiers={r.modifiers} /></span>
      </span>
    )
  }

  const renderArea = (ability) => {
    if (!ability.area || ability.area.length === 0) { return null }
    return (
      <span>
        {' '}
        <strong className="Monster__ability-label">Area</strong>
        {' '}
        {ability.area.map((a, i) => a.text || `${a.size}-${a.unit} ${a.shape}`).join(', ')}
      </span>
    )
  }

  const renderSavingThrow = (ability) => {
    if (!ability.saving_throw) { return null }

    // Handle both array (1.4) and object (1.3) formats
    const isArray = Array.isArray(ability.saving_throw)
    const saves = isArray ? ability.saving_throw : [ability.saving_throw]

    return (
      <span>
        {' '}
        <strong className="Monster__ability-label">{ability.ability_type === 'affliction' ? 'Saving Throw' : 'Save'}</strong>
        {' '}
        {saves.map((st, j) => (
          <Changed path={basePath ? (isArray ? `${basePath}/saving_throw/${j}` : `${basePath}/saving_throw`) : null} key={j}>
            <span>
              {j > 0 ? ', ' : ''}
              {st.basic ? 'basic ' : ''}
              DC{st.dc ? ` ${st.dc}` : ''}
              {st.save_type ? ` ${st.save_type}` : ''}
              {st.result ? ` ${st.result}` : ''}
              <Modifiers modifiers={st.modifiers} />
            </span>
          </Changed>
        ))}
      </span>
    )
  }

  const renderDamage = (ability) => {
    const _dam = (damage) => {
      let retval = ""
      if (damage.formula) {
        retval += `${damage.formula} `
      }
      if (damage.damage_type) {
        retval += `${damage.damage_type} `
      }
      if (damage.notes) {
        retval += `${damage.notes}`
      }
      return retval
    }

    if (!ability.damage) { return null }
    return (
      <Changed path={basePath ? `${basePath}/damage` : null}>
        <span>
          {' '}
          <strong className="Monster__ability-label">Damage</strong>
          {' '}
          {ability.damage.map((d, i) =>
            `${_dam(d)}`).join(', ')
          }
        </span>
      </Changed>
    )
  }

  const renderSuccess = (success, name) => {
    if (!success) { return null }
    return (
      <div className='Monster__ability_success'>
        <strong className="Monster__ability-label">{name}</strong>
        {' '}{success}
      </div>
    )
  }

  // Detail sections + affliction stages that trail the ability text, each separated by
  // "; " (the first by " "). Sections render only when present; every stage entry
  // renders. Built as one ordered list so the separator comes from position, not a
  // mutated closure variable (2ne). Order matches the original JSX: the labelled
  // sections, then the stages, then Special.
  const detailSegments = [
    { label: null, content: ability.context },
    { label: 'Cost', content: ability.cost },
    { label: 'Prerequisite', content: ability.prerequisite },
    { label: 'Requirement', content: ability.requirement },
    { label: 'Requirements', content: ability.requirements },
    { label: 'Frequency', content: ability.frequency },
    { label: 'Trigger', content: ability.trigger },
    { label: 'Effect', content: ability.effect },
    { label: 'Onset', content: ability.onset },
    { label: 'Maximum Duration', content: ability.maximum_duration },
  ]
    .filter((seg) => seg.content)
    .concat((ability.stages || []).map((s, j) => ({ label: s.name || `Stage ${j + 1}`, content: s.text })))
    .concat(ability.special ? [{ label: 'Special', content: ability.special }] : [])
    .map((seg, k) => (
      <span key={k}>
        {k === 0 ? ' ' : '; '}
        <strong className="Monster__ability-label">{seg.label}</strong>
        {' '}
        <Markdown text={seg.content} />
      </span>
    ))

  const hasUMA = !!ability.universal_monster_ability
  const nameEl = hasUMA ? (
    <strong className="Monster__ability-name Monster__uma-toggle" onClick={() => setUmaExpanded(!umaExpanded)}>
      {ability.name}
    </strong>
  ) : (
    <strong className="Monster__ability-name">{ability.name}</strong>
  )

  // A template-ADDED ability highlights as a block: basePath is the
  // ability's own indexed path (buildChangedPaths marks appended indices).
  // Sub-field highlights (saving_throw, damage) cover in-place
  // modification of existing abilities — added-only, so a DC tweak inside
  // an existing ability doesn't light the whole block.
  // NOTE: only saving_throw and damage have inner wrappers because those
  // are the only ability subfields any template modifies in place today.
  // A future template targeting text/range/area/traits needs a matching
  // inner Changed wrapper here or the modification renders unhighlighted
  // (tracked in beads).
  return (
    <Changed path={basePath} block added key={i}>
    <div>
      {nameEl} {
        renderAction(ability)
      }{
        renderTraits(ability)
      }{
        renderArea(ability)
      }{
        renderRange(ability)
      }{
        renderSavingThrow(ability)
      }{
        renderDamage(ability)
      }{period}{' '}{
        typeof ability.text === 'undefined'
          ? null
          : <Markdown text={ability.text} />
      }{
        detailSegments
      }{
        renderSuccess(ability.critical_success, "Critical Success")
      }{
        renderSuccess(ability.success, "Success")
      }{
        renderSuccess(ability.failure, "Failure")
      }{
        renderSuccess(ability.critical_failure, "Critical Failure")
      }
      {umaExpanded ? <UMAExpansion uma={ability.universal_monster_ability} /> : null}
    </div>
    </Changed>
  )
}

export default Ability
