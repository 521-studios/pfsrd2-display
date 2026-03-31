import React, { useState, useCallback } from 'react'
import InlineAbility from './InlineAbility'
import Changed from '../../shared/Changed'
import UMAExpansion from '../../shared/UMAExpansion'
import { comma } from '../../shared/utils'
import Protections from './Protections'

const Hitpoints = (props) => {
  const { hp, hpIndex = 0 } = props
  const [expandedUMAs, setExpandedUMAs] = useState({})

  const toggleUMA = useCallback((name) => {
    setExpandedUMAs(prev => ({ ...prev, [name]: !prev[name] }))
  }, [])

  if (!hp) { return null }

  const opening = (hp) => {
    if (hp.name) {
      return ' ('
    } else if (hp.automatic_abilities) {
      return ', '
    }
    return ''
  }

  const hpName = (hp) => {
    if (hp.name) {
      return `(${hp.name}) `
    }
  }

  const closing = (hp) => {
    if (hp.name) {
      return ')'
    }
  }

  const renderThresholds = (hp) => {
    if (hp.thresholds) {
      return (
        <span>
          {'; '}<strong className="Monster__heading">Thresholds</strong>{' '}
          {hp.thresholds.map((t, i) => {
            return ` ${t.value} (${t.squares} squares)${comma(i, hp.thresholds)}`
          })}
        </span>
      )
    }
  }

  const renderHardness = (hp) => {
    if (hp.hardness) {
      return (
        <span>
          {'; '}<strong className="Monster__heading">Hardness</strong>{' '}
          {hp.hardness}
        </span>
      )
    }
  }

  let abilities = hp.automatic_abilities

  const expandedAbilities = abilities
    ? abilities.filter(a => expandedUMAs[a.name] && a.universal_monster_ability)
    : []

  return (
    <div className='Monster__hitpoints'>
      <div>
        <strong className="Monster__heading">HP</strong>
        {' '}
        <Changed path={`/stat_block/defense/hitpoints/${hpIndex}/hp`}>{hp.hp}</Changed>
        {opening(hp)}
        {hpName(hp)}
        {abilities ? <span>
          {abilities.map((a, i) => {
            return (
              <InlineAbility ability={a} key={i} onToggleUMA={toggleUMA}>{comma(i, abilities)}</InlineAbility>
            )
          })}
        </span> : null}
        {closing(hp)}
        {renderThresholds(hp)}
        {renderHardness(hp)}
        <Protections protections={hp.immunities} protectionType='Immunities'
          changePath={`/stat_block/defense/hitpoints/${hpIndex}/immunities`} />
        <Protections protections={hp.resistances} protectionType='Resistances'
          changePath={`/stat_block/defense/hitpoints/${hpIndex}/resistances`} />
        <Protections protections={hp.weaknesses} protectionType='Weaknesses'
          changePath={`/stat_block/defense/hitpoints/${hpIndex}/weaknesses`} />
      </div>
      {expandedAbilities.map(a => (
        <UMAExpansion uma={a.universal_monster_ability} key={a.name} />
      ))}
    </div>
  )
}

export default Hitpoints
