import React from 'react'
import Changed from '../shared/Changed'
import Traits from './components/Traits'
import Grafts from './components/Grafts'
import Knowledges from './components/Knowledges'
import Senses from './components/Senses'
import Languages from './components/Languages'
import Skills from './components/Skills'
import AbilityScores from './components/AbilityScores'
import Gear from './components/Gear'
import Ability from './components/Ability'
import Defense from './components/Defense'
import Offense from './components/Offense'
import MonsterCard from './components/MonsterCard'
import { capitalize } from '../shared/utils'

const CreatureStatBlockV1_2 = ({ data }) => {
  const stat_block = data.stat_block
  const creature_type = stat_block.creature_type
  const stats = stat_block.statistics

  return (
    <div className='Monster'>
      <MonsterCard
        image={stat_block.image ? stat_block.image.image : null}
      />
      <div className='Monster__header'>
        <div className='Monster__name'>{data.name}</div>
        <div className='Monster__level'>
          {capitalize(data.type)} <Changed path="/stat_block/creature_type/level">{creature_type.level}</Changed>
        </div>
      </div>

      <hr />
      <Traits traits={creature_type.traits} creatureTypes={creature_type.creature_types} />
      <Grafts grafts={creature_type.grafts} />
      <Knowledges knowledges={creature_type.knowledge} />
      <hr />
      <Senses senses={stat_block.senses} />
      <Languages languages={stats.languages} />
      <Skills skills={stats.skills} />
      <AbilityScores stats={stats} />
      <Gear gear={stat_block.gear} />
      {stat_block.interaction_abilities ? (
        <div className='Monster__abilities'>
          {stat_block.interaction_abilities.map((ability, i) => {
            return (
              <Ability ability={ability} i={i} key={i} />
            )
          })}
        </div>
      ) : null}
      <hr />
      <Defense defense={stat_block.defense} />
      <hr />

      <Offense offense={stat_block.offense} />
    </div>
  )
}

export default CreatureStatBlockV1_2
