import React from 'react'

const getCount = (spell) => {
  if (spell.count_text) {
    return (<React.Fragment>({spell.count_text})</React.Fragment>)
  } else if (spell.count > 1) {
    return (<React.Fragment>(x{spell.count})</React.Fragment>)
  }
}

const Spell = (props) => {
  const { spell } = props

  if (!spell) { return null }

  let count = getCount(spell)

  return (
    <span>
      {spell.name}
      {count ? <React.Fragment>{' '}{count}</React.Fragment> : null}
    </span>
  )
}

export default Spell
