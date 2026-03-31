import React from 'react'
import Modifiers from './Modifiers'

const InlineAbility = (props) => {
  const { ability, children, onToggleUMA } = props

  if (!ability) { return null }

  const renderValue = (ability) => {
    if (ability.value) {
      return ` ${ability.value}`
    }
    return ''
  }

  const hasUMA = !!ability.universal_monster_ability
  const nameEl = hasUMA ? (
    <span className="Monster__uma-toggle" onClick={() => onToggleUMA && onToggleUMA(ability.name)}>
      {ability.name}
    </span>
  ) : ability.name

  return (
    <span className='Monster__inlineAbility'>
      {nameEl}
      {renderValue(ability)}
      <Modifiers modifiers={ability.modifiers} />
      {children}
    </span>
  )
}

export default InlineAbility
