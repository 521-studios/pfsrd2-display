import React from 'react'
import Range from './Range'
import Modifiers from './Modifiers'

const SpecialSense = (props) => {
  const { specialSense, i, children } = props

  if (!specialSense) { return null }

  return (
    <span className='Monster__inlineAbility' key={i}>
      {specialSense.name}<Modifiers modifiers={specialSense.modifiers} /><Range range={specialSense.range} />{children}
    </span>
  )
}

export default SpecialSense
