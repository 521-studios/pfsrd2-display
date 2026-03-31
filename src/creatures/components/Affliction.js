import React from 'react'
import Action from './Action'
import Markdown from '../../shared/Markdown'
import Modifiers from './Modifiers'

const getTraits = (affliction) => {
  if (affliction.traits && affliction.traits.length > 0) {
    return ` (${affliction.traits.map(t => t.name).join(', ')})`
  }
  return ""
}

const Affliction = (props) => {
  const { affliction, i } = props

  if (!affliction) { return null }

  let semicolon = " "

  const separator = () => {
    let result = `${semicolon}`
    semicolon = "; "
    return result
  }

  const renderSavingThrow = () => {
    if (affliction.saving_throw) {
      return (
        <span>
          {separator()}
          <strong className="Monster__ability-label">Saving Throw</strong>{' '}
          <span>
            {affliction.saving_throw.save_type} DC {affliction.saving_throw.dc}
            <Modifiers modifiers={affliction.saving_throw.modifiers} />
          </span>
        </span>
      )
    }
  }

  const renderSection = (section, name) => {
    if (!section) { return null }
    return (
      <span>
        {separator()}
        {name ? <strong className="Monster__ability-label">{name}</strong> : null}
        {' '}
        <Markdown text={section} />
      </span>
    )
  }

  let traits = getTraits(affliction)
  const action = affliction.action_type || affliction.action

  return (
    <div key={i}>
      <strong className="Monster__ability-name">{affliction.name}{' '}</strong>
      {action ? <Action name={action.name} /> : null}
      {traits}
      {' '}{
        renderSection(affliction.context, null)
      }{
        renderSavingThrow()
      }{
        renderSection(affliction.requirements, "Requirements")
      }{
        renderSection(affliction.effect, "Effect")
      }{
        renderSection(affliction.onset, "Onset")
      }{
        renderSection(affliction.maximum_duration, "Maximum Duration")
      }
      {affliction.stages ? affliction.stages.map((s, j) => {
        return (
          <span key={j}>{separator()}<strong className="Monster__ability-label">Stage {j + 1}</strong>{' '}{s.text}</span>
        )
      }) : null}{
        renderSection(affliction.special, "Special")
      }{
        renderSection(affliction.text, null)
      }
    </div>
  )
}

export default Affliction
