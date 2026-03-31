import React, { useState, useCallback } from 'react'
import SpecialSense from './SpecialSense'
import Modifiers from './Modifiers'
import RollableText from '../../shared/RollableText'
import Changed from '../../shared/Changed'
import UMAExpansion from '../../shared/UMAExpansion'
import { useDisplay } from '../../context/DisplayContext'
import { comma, decoratedNumber } from '../../shared/utils'

const Senses = (props) => {
  const { senses } = props
  const { monsterName } = useDisplay()
  const [expandedUMAs, setExpandedUMAs] = useState({})

  const toggleUMA = useCallback((name) => {
    setExpandedUMAs(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  if (!senses) { return null }
  const perception = senses.perception
  const special_senses = senses.special_senses

  // Collect UMAs for expanded senses
  const expandedSenses = special_senses
    ? special_senses.filter(ss => expandedUMAs[ss.name] && ss.universal_monster_ability)
    : []

  return (
    <div className='Monster__senses'>
      <div>
        <strong className="Monster__heading">Perception</strong>{' '}
        <Changed path="/stat_block/senses/perception/value">
          <RollableText type="d20" label={`${monsterName} Initiative`} formula={`1d20${decoratedNumber(perception.value)}`}>
            {decoratedNumber(perception.value)}
          </RollableText>
        </Changed>
        <Modifiers modifiers={perception.modifiers} />{comma(-1, special_senses, "; ")}
        {special_senses ? special_senses.map((ss, i) => {
          return (
            <SpecialSense specialSense={ss} i={i} key={i} onToggleUMA={toggleUMA}>
              {comma(i, special_senses)}
            </SpecialSense>
          )
        }) : null}
      </div>
      {expandedSenses.map(ss => (
        <UMAExpansion uma={ss.universal_monster_ability} key={ss.name} />
      ))}
    </div>
  )
}

export default Senses
