import React from 'react'

const Action = props => {
  const { name } = props

  let symbols = {
    'Free Action': 'F',
    'One Action': 'A',
    'Single Action': 'A',
    'Two Actions': 'D',
    'Three Actions': 'T',
    'Reaction': 'R',
    'One Action or more': 'A+',
    'Reaction or One Action': 'R/A',
    'Two to Three Actions': 'D+',
  }
  let text = symbols[name]

  return (
    <span
      className="Monster__actionIcon"
      title={name}>{text} </span>
  )
}

export default Action
