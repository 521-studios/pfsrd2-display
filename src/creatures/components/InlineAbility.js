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

  // No handler (e.g. Languages) → plain text, not a button that does nothing.
  const hasUMA = !!ability.universal_monster_ability && !!onToggleUMA
  const nameEl = hasUMA ? (
    <button type="button" className="Monster__uma-toggle" aria-expanded={umaExpanded} onClick={() => onToggleUMA(ability.name)}>
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
