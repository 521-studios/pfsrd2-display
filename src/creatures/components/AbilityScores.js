import React from 'react'
import RollableText from '../../shared/RollableText'
import { useDisplay } from '../../context/DisplayContext'
import { capitalize, decoratedNumber } from '../../shared/utils'

const AbilityScores = (props) => {
  const { stats } = props
  const { monsterName } = useDisplay()

  if (!stats) { return null }

  const ability_scores = ['str', 'dex', 'con', 'int', 'wis', 'cha'].map(as => [
    as,
    stats[as],
  ])

  return (
    <div className='Monster__abilityScores'>
      {ability_scores.map((as, i) => {
        return (
          <span key={i} className='Monster__abilityScore'>
            <strong className="Monster__heading">{capitalize(as[0])}</strong>{' '}
            <RollableText type="d20" label={`${monsterName} ${capitalize(as[0])}`} formula={`1d20${decoratedNumber(as[1])}`}>
              {decoratedNumber(as[1])}
            </RollableText>
          </span>
        )
      })}
    </div>
  )
}

export default AbilityScores
