import React from 'react'
import Modifiers from './Modifiers'

const InlineAbility = (props) => {
  const { ability, children } = props

  if (!ability) { return null }

  const renderValue = (ability) => {
    if (ability.value) {
      return ` ${ability.value}`
    }
    return ''
  }

  return (
    <span className='Monster__inlineAbility'>
      {ability.name}
      {renderValue(ability)}
      <Modifiers modifiers={ability.modifiers} />
      {children}
    </span>
  )
}

export default InlineAbility
