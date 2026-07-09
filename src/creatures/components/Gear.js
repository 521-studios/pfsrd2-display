import React from 'react'
import Item from './Item'
import Changed from '../../shared/Changed'
import { comma } from '../../shared/utils'

const Gear = (props) => {
  const { gear } = props

  if (!gear) { return null }

  return (
    <div className='Monster__gear'>
      <strong className="Monster__heading">Items </strong>
      {gear.map((item, i) => {
        return (
          <Changed path={`/stat_block/gear/${i}`} added key={i}>
            <Item item={item} i={i}>{comma(i, gear)}</Item>
          </Changed>
        )
      })}
    </div>
  )
}

export default Gear
