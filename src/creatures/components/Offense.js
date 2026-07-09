import React from 'react'
import Ability from './Ability'
import Changed from '../../shared/Changed'
import Affliction from './Affliction'
import Attack from './Attack'
import MythicAbility from './MythicAbility'
import Speed from './Speed'
import Spells from './Spells'

const Offense = (props) => {
  const { offense } = props

  return (
    <div className='Monster__offense'>
      <Speed speed={offense.speed} />
      {(offense.offensive_actions || []).map((oa, i) => {
        if (oa.offensive_action_type === 'attack') {
          // A template-ADDED Strike (Dwarf's clan dagger) highlights whole.
          // In-place modifications show via inner wrappers on bonus and
          // damage; attack traits/name/weapon have none yet (tracked in
          // beads) and render unhighlighted when modified.
          return (
            <Changed path={`/stat_block/offense/offensive_actions/${i}`} block added key={i}>
              <Attack attack={oa.attack} i={i} />
            </Changed>
          )
        } else if (oa.offensive_action_type === 'spells') {
          return (<Spells spells={oa.spells} i={i}
            basePath={`/stat_block/offense/offensive_actions/${i}/spells`} key={i} />)
        } else if (oa.offensive_action_type === 'affliction') {
          return (<Affliction affliction={oa.affliction} i={i} key={i} />)
        } else if (oa.offensive_action_type === 'ability') {
          return (<Ability ability={oa.ability} i={i}
            basePath={`/stat_block/offense/offensive_actions/${i}/ability`} key={i} />)
        } else if (oa.offensive_action_type === 'mythic_ability') {
          return (<MythicAbility mythicAbility={oa.mythic_ability} i={i} key={i} />)
        }
      })}
    </div>
  )
}

export default Offense
