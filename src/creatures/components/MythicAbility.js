import React from 'react'
import Action from './Action'
import Markdown from '../../shared/Markdown'

const MythicAbility = (props) => {
  const { mythicAbility, i } = props

  if (!mythicAbility) { return null }

  return (
    <div key={i}>
      <strong className="Monster__ability-name">{mythicAbility.name}</strong>
      {' '}({mythicAbility.mythic_points} Mythic {mythicAbility.mythic_points === 1 ? 'Point' : 'Points'})
      {mythicAbility.mythic_activations && mythicAbility.mythic_activations.map((activation, j) => {
        const action = activation.action_type
        return (
          <div key={j} className="MythicAbility__activation">
            <strong className="Monster__ability-name">{activation.name}</strong>
            {action ? <span>{' '}<Action name={action.name} /></span> : null}
            {activation.cost ? <span>{' '}<strong className="Monster__ability-label">Cost</strong> {activation.cost}</span> : null}
            {activation.trigger ? <span>{' '}<strong className="Monster__ability-label">Trigger</strong> {activation.trigger}</span> : null}
            {activation.text ? <span>{' '}<Markdown text={activation.text} /></span> : null}
            {activation.effect ? <span>{' '}<strong className="Monster__ability-label">Effect</strong> <Markdown text={activation.effect} /></span> : null}
          </div>
        )
      })}
    </div>
  )
}

export default MythicAbility
