import React from 'react'
import Range from './Range'
import Modifiers from './Modifiers'

const SpecialSense = (props) => {
  const { specialSense, i, children, onToggleUMA, umaExpanded = false } = props

  if (!specialSense) { return null }

  const hasUMA = !!specialSense.universal_monster_ability && !!onToggleUMA
  const nameEl = hasUMA ? (
    <button type="button" className="Monster__uma-toggle" aria-expanded={umaExpanded} onClick={() => onToggleUMA(specialSense.name)}>
      {specialSense.name}
    </button>
  ) : specialSense.name

  return (
    <span className='Monster__inlineAbility' key={i}>
      {nameEl}<Modifiers modifiers={specialSense.modifiers} /><Range range={specialSense.range} />{children}
    </span>
  )
}

export default SpecialSense
