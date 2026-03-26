import React from 'react'
import Spell from './Spell'

const getListTitle = (spell_list) => {
  if (spell_list.constant) {
    return (<strong>Constant {spell_list.level_text}</strong>)
  } else if (spell_list.cantrips) {
    return (<strong>Cantrips {spell_list.level_text}</strong>)
  } else {
    return (<strong>{spell_list.level_text}</strong>)
  }
}

const SpellList = (props) => {
  const { spell_list } = props

  if (!spell_list) { return null }

  let list_title = getListTitle(spell_list)

  return (
    <span>
      {list_title}{' '}
      {spell_list.spells.map((s, i) => {
        return (
          <React.Fragment key={i}>
            <Spell spell={s} />
            {i < spell_list.spells.length - 1 ? ", " : ""}
          </React.Fragment>
        )
      })}
      ;{' '}
    </span>
  )
}

export default SpellList
