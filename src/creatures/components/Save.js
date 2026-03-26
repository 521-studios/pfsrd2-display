import React from 'react'
import Modifiers from './Modifiers'
import RollableText from '../../shared/RollableText'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const Save = (props) => {
  const { save } = props
  const { monsterName } = useDisplay()

  if (!save) { return null }

  return (
    <span className='Monster__save'>
      <strong>{save.name}</strong>{' '}
      <RollableText type="d20" label={`${monsterName} ${save.name}`} formula={`1d20${decoratedNumber(save.value)}`}>
        {decoratedNumber(save.value)}
      </RollableText>
      <Modifiers modifiers={save.modifiers} />
    </span>
  )
}

export default Save
