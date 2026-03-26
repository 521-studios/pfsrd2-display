import React from 'react'
import Modifiers from './Modifiers'
import Markdown from '../../shared/Markdown'

const Protection = (props) => {
  const { protection, children } = props

  if (!protection) { return null }

  const renderValue = (protection) => {
    if (protection.value) {
      return ` ${protection.value}`
    }
    return ''
  }

  return (
    <span className='Monster__protection'>
      <Markdown text={protection.name} />{renderValue(protection)}<Modifiers modifiers={protection.modifiers} />{children}
    </span>
  )
}

export default Protection
