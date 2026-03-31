import React from 'react'
import Modifiers from './Modifiers'
import Changed from '../../shared/Changed'

const AC = (props) => {
  const { ac } = props

  if (!ac) { return null }

  return (
    <span className='Monster__ac'>
      <strong className="Monster__heading">AC </strong>
      <Changed path="/stat_block/defense/ac/value">{ac.value}</Changed>
      <Modifiers modifiers={ac.modifiers} />
    </span>
  )
}

export default AC
