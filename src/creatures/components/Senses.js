import React from 'react'
import SpecialSense from './SpecialSense'
import Modifiers from './Modifiers'
import RollableText from '../../shared/RollableText'
import Changed from '../../shared/Changed'
import { useDisplay } from '../../context/DisplayContext'
import { comma, decoratedNumber } from '../../shared/utils'

const Senses = (props) => {
  const { senses } = props
  const { monsterName } = useDisplay()

  if (!senses) { return null }
  const perception = senses.perception
  const special_senses = senses.special_senses

  return (
    <div className='Monster__senses'>
      <strong>Perception</strong>{' '}
      <Changed path="/stat_block/senses/perception/value">
        <RollableText type="d20" label={`${monsterName} Initiative`} formula={`1d20${decoratedNumber(perception.value)}`}>
          {decoratedNumber(perception.value)}
        </RollableText>
      </Changed>
      <Modifiers modifiers={perception.modifiers} />{comma(-1, special_senses, "; ")}
      {special_senses ? special_senses.map((ss, i) => {
        return (
          <SpecialSense specialSense={ss} i={i} key={i}>{comma(i, special_senses)}</SpecialSense>
        )
      }) : null}
    </div>
  )
}

export default Senses
