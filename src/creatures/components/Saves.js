import React from 'react'
import Modifiers from './Modifiers'
import Save from './Save'

const Saves = (props) => {
  const { saves } = props

  if (!saves) { return null }

  return (
    <span className='Monster__saves'>
      <Save save={saves.fort} />{', '}
      <Save save={saves.ref} />{', '}
      <Save save={saves.will} />
      <Modifiers modifiers={saves.modifiers} noparens={true} semicolon={true} />
    </span>
  )
}

export default Saves
