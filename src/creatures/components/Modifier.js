import React from 'react'
import Markdown from '../../shared/Markdown'

const Modifier = props => {
  const { modifier, i, children } = props

  if (!modifier) { return null }

  return (
    <span className="Monster__modifier"><Markdown text={modifier.name} />{children}</span>
  )
}

export default Modifier
