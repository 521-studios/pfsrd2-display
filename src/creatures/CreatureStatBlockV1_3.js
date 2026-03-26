import React from 'react'
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
import { useDisplay } from '../context/DisplayContext'
import { capitalize } from '../shared/utils'

const CreatureStatBlockV1_3 = ({ data }) => {
  const { onLoadMonster } = useDisplay()
  const stat_block = data.stat_block
  const creature_type = stat_block.creature_type
  const stats = stat_block.statistics

  return (
    <div className='Monster'>
      <MonsterCard
        name={data.name}
        image={stat_block.image ? stat_block.image.image : null}
      />
      <div className='Monster__header'>
        <div className='Monster__name'>{data.name}</div>
        <div className='Monster__level'>
          {capitalize(data.type)} {creature_type.level}
          {data.edition ? (
            <span className='Monster__edition'>
              {' ('}{capitalize(data.edition)}{')'}
              {data.alternate_link && onLoadMonster ? (
                <span className='Monster__alternateLink'
                  onClick={() => onLoadMonster(`${data.alternate_link['game-obj']}:${data.alternate_link.aonid}`)}
                > → {capitalize(data.alternate_link.alternate_type)}</span>
              ) : null}
            </span>
          ) : null}
        </div>
      </div>

      <hr />
      <Traits traits={creature_type.traits} />
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

export default CreatureStatBlockV1_3
