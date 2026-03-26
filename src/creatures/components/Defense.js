import React from 'react'
import Ability from './Ability'
import AC from './AC'
import Saves from './Saves'
import Hitpoints from './Hitpoints'
import Changed from '../../shared/Changed'

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
              <Changed path={`/stat_block/defense/automatic_abilities/${i}`} block key={i}>
                <Ability ability={ability} i={i} />
              </Changed>
            )
          })}
        </div>
      ) : null}
      {defense.reactive_abilities ? (
        <div className='Monster__abilities'>
          {defense.reactive_abilities.map((ability, i) => {
            return (
              <Changed path={`/stat_block/defense/reactive_abilities/${i}`} block key={i}>
                <Ability ability={ability} i={i} />
              </Changed>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

export default Defense
