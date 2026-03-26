import React from 'react'

const Speed = (props) => {
  const { speed } = props

  if (!speed || !speed.movement) { return null }

  return (
    <div className='Monster__speed'>
      <strong>Speed{' '}</strong>
      {speed.movement.map((m, i) =>
        <span key={i}>
          {m.name}
          {typeof m.modifiers === 'undefined'
            ? null
            : <span>{' '}({
              m.modifiers.map((m, i) => m.name).join(', ')
            })</span>
          }
          {i < speed.movement.length - 1 ? ", " : ""}
        </span>
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
