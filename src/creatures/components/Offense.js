import React from 'react'
import Ability from './Ability'
import Changed from '../../shared/Changed'
import Affliction from './Affliction'
import Attack from './Attack'
import MythicAbility from './MythicAbility'
import Speed from './Speed'
import Spells from './Spells'

// Renderers keyed by offensive_action_type — replaces an if/else-if chain (llu). Each
// takes (oa, i) and returns the element; an unknown type maps to nothing.
const OFFENSIVE_ACTIONS = {
  attack: (oa, i) => (
    // A template-ADDED Strike (Dwarf's clan dagger) highlights whole. In-place
    // modifications show via inner wrappers on bonus and damage; attack
    // traits/name/weapon have none yet (tracked in beads) and render unhighlighted
    // when modified.
    <Changed path={`/stat_block/offense/offensive_actions/${i}`} block added key={i}>
      <Attack attack={oa.attack} i={i} />
    </Changed>
  ),
  spells: (oa, i) => (
    <Spells spells={oa.spells} i={i} basePath={`/stat_block/offense/offensive_actions/${i}/spells`} key={i} />
  ),
  affliction: (oa, i) => <Affliction affliction={oa.affliction} i={i} key={i} />,
  ability: (oa, i) => (
    <Ability ability={oa.ability} i={i} basePath={`/stat_block/offense/offensive_actions/${i}/ability`} key={i} />
  ),
  mythic_ability: (oa, i) => <MythicAbility mythicAbility={oa.mythic_ability} i={i} key={i} />,
}

const Offense = (props) => {
  const { offense } = props

  return (
    <div className='Monster__offense'>
      <Speed speed={offense.speed} />
      {(offense.offensive_actions || []).map((oa, i) => {
        const render = OFFENSIVE_ACTIONS[oa.offensive_action_type]
        return render ? render(oa, i) : null
      })}
    </div>
  )
}

export default Offense
