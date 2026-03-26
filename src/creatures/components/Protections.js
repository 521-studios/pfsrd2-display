import React from 'react'
import Protection from './Protection'
import { comma, capitalize } from '../../shared/utils'

const Protections = (props) => {
  const { protections, protectionType } = props

  if (!protections) { return null }

  return (
    <span className='Monster_protections'>
      {'; '}<strong>{capitalize(protectionType)}</strong>{' '}
      {protections.map((p, i) => {
        return (
          <Protection protection={p} key={i}>{comma(i, protections)}</Protection>
        )
      })}
    </span>
  )
}

export default Protections
