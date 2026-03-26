import React from 'react'
import Modifiers from './Modifiers'

const Range = props => {
  const { range } = props

  if (!range) { return null }

  return (
    <span className="Monster__range">&nbsp;{range.range} {range.unit}<Modifiers modifiers={range.modifiers} /></span>
  )
}

export default Range
