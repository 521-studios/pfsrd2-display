import React from 'react'
import Ability from './Ability'
import AC from './AC'
import Saves from './Saves'
import Hitpoints from './Hitpoints'

const Defense = (props) => {
  const { defense } = props

  if (!defense) { return null }

  return (
    <div className='Monster__defense'>
      <div>
        <AC ac={defense.ac} />{'; '}
        <Saves saves={defense.saves} />
      </div>
      {defense.hitpoints.map((hp, i) => {
        return (
          <Hitpoints hp={hp} hpIndex={i} key={i} />
        )
      })}
      {defense.automatic_abilities ? (
        <div className='Monster__abilities'>
          {defense.automatic_abilities.map((ability, i) => {
            return (
              <Ability ability={ability} i={i}
                basePath={`/stat_block/defense/automatic_abilities/${i}`} key={i} />
            )
          })}
        </div>
      ) : null}
      {defense.reactive_abilities ? (
        <div className='Monster__abilities'>
          {defense.reactive_abilities.map((ability, i) => {
            return (
              <Ability ability={ability} i={i}
                basePath={`/stat_block/defense/reactive_abilities/${i}`} key={i} />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default Defense
