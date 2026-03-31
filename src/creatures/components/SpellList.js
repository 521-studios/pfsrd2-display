import React from 'react'
import Spell from './Spell'
import Changed from '../../shared/Changed'

const getListTitle = (spell_list) => {
  if (spell_list.constant) {
    return (<strong className="Monster__heading">Constant {spell_list.level_text}</strong>)
  } else if (spell_list.cantrips) {
    return (<strong className="Monster__heading">Cantrips {spell_list.level_text}</strong>)
  } else {
    return (<strong className="Monster__heading">{spell_list.level_text}</strong>)
  }
}

const SpellList = (props) => {
  const { spell_list, basePath } = props

  if (!spell_list) { return null }

  let list_title = getListTitle(spell_list)

  return (
    <span>
      {list_title}{' '}
      {spell_list.spells.map((s, i) => {
        return (
          <Changed path={basePath ? `${basePath}/spells/${i}` : null} key={i}>
            <span>
              <Spell spell={s} />
              {i < spell_list.spells.length - 1 ? ", " : ""}
            </span>
          </Changed>
        )
      })}
      ;{' '}
    </span>
  )
}

export default SpellList
