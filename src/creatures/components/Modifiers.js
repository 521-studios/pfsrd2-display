import React from 'react'
import Modifier from './Modifier'
import { comma } from '../../shared/utils'

const Modifiers = props => {
  const { modifiers, noparens, semicolon } = props

  if (!modifiers) { return null }

  return (
    <span className='Monster__modifiers'>{semicolon ? ";" : ""}&nbsp;{noparens ? '' : '('}{
      modifiers.map((m, i) => {
        return (
          <Modifier modifier={m} i={i} key={i}>{comma(i, modifiers)}</Modifier>
        )
      })
    }{noparens ? '' : ')'}</span>
  )
}

export default Modifiers
