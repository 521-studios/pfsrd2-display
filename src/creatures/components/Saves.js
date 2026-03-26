import React from 'react'
import Modifiers from './Modifiers'
import Save from './Save'

const Saves = (props) => {
  const { saves } = props

  if (!saves) { return null }

  return (
    <span className='Monster__saves'>
      <Save save={saves.fort} changePath="/stat_block/defense/saves/fort/value" />{', '}
      <Save save={saves.ref} changePath="/stat_block/defense/saves/ref/value" />{', '}
      <Save save={saves.will} changePath="/stat_block/defense/saves/will/value" />
      <Modifiers modifiers={saves.modifiers} noparens={true} semicolon={true} />
    </span>
  )
}

export default Saves
