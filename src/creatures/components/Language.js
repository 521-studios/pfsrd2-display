import React from 'react'
import Modifiers from './Modifiers'

const Language = (props) => {
  const { language, i, children } = props

  if (!language) { return null }

  return (
    <span className='Monster__language' key={i}>
      {language.name}<Modifiers modifiers={language.modifiers} />{children}
    </span>
  )
}

export default Language
