import React from 'react'
import Modifiers from './Modifiers'

const Item = (props) => {
  const { item, i, children } = props

  if (!item) { return null }

  return (
    <span className='Monster__item'>{item.name}<Modifiers modifiers={item.modifiers} />{children}</span>
  )
}

export default Item
