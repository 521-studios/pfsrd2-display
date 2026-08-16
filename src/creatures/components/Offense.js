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
  // spells/affliction/mythic have no inner added-Changed of their own, so an
  // appended one is highlighted here at the action-index level. attack (its own outer
  // Changed) and ability (its inner block-added Changed on .../ability, a descendant of
  // the added index) already self-highlight, so they're not wrapped again. (tee)
  spells: (oa, i) => (
    <Changed path={`/stat_block/offense/offensive_actions/${i}`} block added key={i}>
      <Spells spells={oa.spells} i={i} basePath={`/stat_block/offense/offensive_actions/${i}/spells`} />
    </Changed>
  ),
  affliction: (oa, i) => (
    <Changed path={`/stat_block/offense/offensive_actions/${i}`} block added key={i}>
      <Affliction affliction={oa.affliction} i={i} />
    </Changed>
  ),
  ability: (oa, i) => (
    <Ability ability={oa.ability} i={i} basePath={`/stat_block/offense/offensive_actions/${i}/ability`} key={i} />
  ),
  mythic_ability: (oa, i) => (
    <Changed path={`/stat_block/offense/offensive_actions/${i}`} block added key={i}>
      <MythicAbility mythicAbility={oa.mythic_ability} i={i} />
    </Changed>
  ),
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
