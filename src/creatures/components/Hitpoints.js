import React from 'react'
import InlineAbility from './InlineAbility'
import { comma } from '../../shared/utils'
import Protections from './Protections'

const Hitpoints = (props) => {
  const { hp } = props

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
          {'; '}<strong>Thresholds</strong>{' '}
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
          {'; '}<strong>Hardness</strong>{' '}
          {hp.hardness}
        </span>
      )
    }
  }

  let abilities = hp.automatic_abilities

  return (
    <div className='Monster__hitpoints'>
      <strong>HP</strong>
      {' '}
      {hp.hp}
      {opening(hp)}
      {hpName(hp)}
      {abilities ? <span>
        {abilities.map((a, i) => {
          return (
            <InlineAbility ability={a} key={i}>{comma(i, abilities)}</InlineAbility>
          )
        })}
      </span> : null}
      {closing(hp)}
      {renderThresholds(hp)}
      {renderHardness(hp)}
      <Protections protections={hp.immunities} protectionType='Immunities' />
      <Protections protections={hp.resistances} protectionType='Resistances' />
      <Protections protections={hp.weaknesses} protectionType='Weaknesses' />
    </div>
  )
}

export default Hitpoints
