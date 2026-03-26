import React from 'react'
import Modifiers from './Modifiers'

const Graft = (props) => {
  const { graft, i } = props

  if (!graft) { return null }

  let name = graft.name
  if (graft.value) {
    name += ` ${graft.value}`
  }

  return (
    <span className='Monster__graft' key={i}>
      {name}<Modifiers modifiers={graft.modifiers} />&nbsp;
    </span>
  )
}

export default Graft
