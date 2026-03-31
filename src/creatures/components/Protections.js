import React from 'react'
import Protection from './Protection'
import Changed from '../../shared/Changed'
import { comma, capitalize } from '../../shared/utils'

const Protections = (props) => {
  const { protections, protectionType, changePath } = props

  if (!protections || protections.length === 0) { return null }

  return (
    <span className='Monster_protections'>
      {'; '}<strong className="Monster__heading">{capitalize(protectionType)}</strong>{' '}
      {protections.map((p, i) => {
        return (
          <Changed path={changePath ? `${changePath}/${i}` : null} key={i}>
            <Protection protection={p}>{comma(i, protections)}</Protection>
          </Changed>
        )
      })}
    </span>
  )
}

export default Protections
