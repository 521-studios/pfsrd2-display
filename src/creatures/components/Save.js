import React from 'react'
import Modifiers from './Modifiers'
import RollableText from '../../shared/RollableText'
import Changed from '../../shared/Changed'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const Save = (props) => {
  const { save, changePath } = props
  const { monsterName } = useDisplay()

  if (!save) { return null }

  return (
    <span className='Monster__save'>
      <strong>{save.name}</strong>{' '}
      <Changed path={changePath}>
        <RollableText type="d20" label={`${monsterName} ${save.name}`} formula={`1d20${decoratedNumber(save.value)}`}>
          {decoratedNumber(save.value)}
        </RollableText>
      </Changed>
      <Modifiers modifiers={save.modifiers} />
    </span>
  )
}

export default Save
