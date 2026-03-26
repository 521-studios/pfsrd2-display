import React from 'react'
import Modifiers from './Modifiers'

const AC = (props) => {
  const { ac } = props

  if (!ac) { return null }

  return (
    <span className='Monster__ac'>
      <strong>AC </strong>
      {ac.value}<Modifiers modifiers={ac.modifiers} />
    </span>
  )
}

export default AC
