import React from 'react'
import Changed from '../../shared/Changed'

const Speed = (props) => {
  const { speed } = props

  if (!speed || !speed.movement) { return null }

  return (
    <div className='Monster__speed'>
      <strong>Speed{' '}</strong>
      {speed.movement.map((m, i) =>
        <Changed path={`/stat_block/offense/speed/movement/${i}`} key={i}>
          <span>
            {m.name}
            {typeof m.modifiers === 'undefined'
              ? null
              : <span>{' '}({
                m.modifiers.map((mod, j) => mod.name).join(', ')
              })</span>
            }
            {i < speed.movement.length - 1 ? ", " : ""}
          </span>
        </Changed>
      )}
      {typeof speed.modifiers === 'undefined'
        ? null
        : <span>;{' '}{
          speed.modifiers.map((m, i) => m.name).join(', ')
        }</span>
      }
    </div>
  )
}

export default Speed
