import React from 'react'
import Modifiers from './Modifiers'

const InlineAbility = (props) => {
  const { ability, children, onToggleUMA, umaExpanded = false } = props

  if (!ability) { return null }

  const renderValue = (ability) => {
    if (ability.value) {
      return ` ${ability.value}`
    }
    return ''
  }

  const hasUMA = !!ability.universal_monster_ability
  const nameEl = hasUMA ? (
    <button type="button" className="Monster__uma-toggle" aria-expanded={umaExpanded} onClick={() => onToggleUMA && onToggleUMA(ability.name)}>
      {ability.name}
    </button>
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
