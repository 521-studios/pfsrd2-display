import React from 'react'
import Action from './Action'
import Modifiers from './Modifiers'
import Changed from '../../shared/Changed'
import Markdown from '../../shared/Markdown'

const Ability = (props) => {
  const { ability, i, basePath } = props

  if (!ability) { return null }

  let period = ""

  let semicolon = " "

  const separator = () => {
    let result = `${semicolon}`
    semicolon = "; "
    return result
  }

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
    period = "."
    const r = ability.range
    const display = r.touch ? 'touch' : r.text || `${r.range} ${r.unit}`
    return (
      <span>
        {' '}
        <strong>Range</strong>
        {' '}
        <span>{display}<Modifiers modifiers={r.modifiers} /></span>
      </span>
    )
  }

  const renderArea = (ability) => {
    if (!ability.area || ability.area.length === 0) { return null }
    period = "."
    return (
      <span>
        {' '}
        <strong>Area</strong>
        {' '}
        {ability.area.map((a, i) => a.text || `${a.size}-${a.unit} ${a.shape}`).join(', ')}
      </span>
    )
  }

  const renderSavingThrow = (ability) => {
    if (!ability.saving_throw) { return null }
    period = "."

    // Handle both array (1.4) and object (1.3) formats
    const saves = Array.isArray(ability.saving_throw)
      ? ability.saving_throw
      : [ability.saving_throw]

    return (
      <span>
        {' '}
        <strong>{ability.ability_type === 'affliction' ? 'Saving Throw' : 'Save'}</strong>
        {' '}
        {saves.map((st, j) => (
          <Changed path={basePath ? `${basePath}/saving_throw/${j}` : null} key={j}>
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
    period = "."
    return (
      <Changed path={basePath ? `${basePath}/damage` : null}>
        <span>
          {' '}
          <strong>Damage</strong>
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
        <strong>{name}</strong>
        {' '}{success}
      </div>
    )
  }

  const renderSection = (section, name) => {
    if (!section) { return null }
    return (
      <span>
        {separator()}
        <strong>{name}</strong>
        {' '}
        <Markdown text={section} />
      </span>
    )
  }

  const renderStages = (stages) => {
    if (!stages || stages.length === 0) { return null }
    return stages.map((s, j) => (
      <span key={j}>
        {separator()}
        <strong>{s.name || `Stage ${j + 1}`}</strong>
        {' '}<Markdown text={s.text} />
      </span>
    ))
  }

  return (
    <div key={i}>
      <strong>{ability.name}</strong> {
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
        renderSection(ability.context, null)
      }{
        renderSection(ability.cost, "Cost")
      }{
        renderSection(ability.prerequisite, "Prerequisite")
      }{
        renderSection(ability.requirement, "Requirement")
      }{
        renderSection(ability.requirements, "Requirements")
      }{
        renderSection(ability.frequency, "Frequency")
      }{
        renderSection(ability.trigger, "Trigger")
      }{
        renderSection(ability.effect, "Effect")
      }{
        renderSection(ability.onset, "Onset")
      }{
        renderSection(ability.maximum_duration, "Maximum Duration")
      }{
        renderStages(ability.stages)
      }{
        renderSection(ability.special, "Special")
      }{
        renderSuccess(ability.critical_success, "Critical Success")
      }{
        renderSuccess(ability.success, "Success")
      }{
        renderSuccess(ability.failure, "Failure")
      }{
        renderSuccess(ability.critical_failure, "Critical Failure")
      }
    </div>
  )
}

export default Ability
