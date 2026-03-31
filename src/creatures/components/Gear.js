import React from 'react'
import Item from './Item'
import { comma } from '../../shared/utils'

const Gear = (props) => {
  const { gear } = props

  if (!gear) { return null }

  return (
    <div className='Monster__gear'>
      <strong className="Monster__heading">Items </strong>
      {gear.map((item, i) => {
        return (
          <Item item={item} i={i} key={i}>{comma(i, gear)}</Item>
        )
      })}
    </div>
  )
}

export default Gear
