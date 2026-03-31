import React from 'react'
import Modifiers from './Modifiers'

const Range = props => {
  const { range } = props

  if (!range) { return null }

  const display = range.touch
    ? 'touch'
    : range.text || `${range.range} ${range.unit}`

  return (
    <span className="Monster__range">&nbsp;{display}<Modifiers modifiers={range.modifiers} /></span>
  )
}

export default Range
