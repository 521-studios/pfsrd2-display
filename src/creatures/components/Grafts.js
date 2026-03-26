import React from 'react'
import Graft from './Graft'

const Grafts = (props) => {
  const { grafts } = props

  if (!grafts) { return null }

  return (
    <div className='Monster__grafts'>
      {grafts.map((g, i) => {
        return (
          <Graft graft={g} key={i} />
        )
      })}
    </div>
  )
}

export default Grafts
