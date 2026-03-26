import React from 'react'
import Action from './Action'
import Markdown from '../../shared/Markdown'

const Ability = (props) => {
  const { ability, i } = props

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
    return (
      <span>
        {' '}
        <strong>Range</strong>
        {' '}
        <span>{ability.range.range} {ability.range.unit}</span>
      </span>
    )
  }

  const renderSavingThrow = (ability) => {
    if (!ability.saving_throw) { return null }
    period = "."
    return (
      <span>
        {' '}
        <strong>Save</strong>
        {' '}
        <span>
          DC{
            ability.saving_throw.dc ? ` ${ability.saving_throw.dc}` : ""
          }{
            ability.saving_throw.save_type ? ` ${ability.saving_throw.save_type}` : ''
          }{
            ability.saving_throw.result ? ` ${ability.saving_throw.result}` : ''
          }
        </span>
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
      <span>
        {' '}
        <strong>Damage</strong>
        {' '}
        {ability.damage.map((d, i) =>
          `${_dam(d)}`).join(', ')
        }
      </span>
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

  return (
    <div key={i}>
      <strong>{ability.name}</strong> {
        renderAction(ability)
      }{
        renderTraits(ability)
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
        renderSection(ability.cost, "Cost")
      }{
        renderSection(ability.prerequisite, "Prerequisite")
      }{
        renderSection(ability.requirement, "Requirement")
      }{
        renderSection(ability.frequency, "Frequency")
      }{
        renderSection(ability.trigger, "Trigger")
      }{
        renderSection(ability.effect, "Effect")
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
