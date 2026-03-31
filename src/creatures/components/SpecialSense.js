import React from 'react'
import Range from './Range'
import Modifiers from './Modifiers'

const SpecialSense = (props) => {
  const { specialSense, i, children, onToggleUMA } = props

  if (!specialSense) { return null }

  const hasUMA = !!specialSense.universal_monster_ability
  const nameEl = hasUMA ? (
    <span className="Monster__uma-toggle" onClick={() => onToggleUMA && onToggleUMA(specialSense.name)}>
      {specialSense.name}
    </span>
  ) : specialSense.name

  return (
    <span className='Monster__inlineAbility' key={i}>
      {nameEl}<Modifiers modifiers={specialSense.modifiers} /><Range range={specialSense.range} />{children}
    </span>
  )
}

export default SpecialSense
