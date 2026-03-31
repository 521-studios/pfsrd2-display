import React from 'react'
import SpellList from './SpellList'
import RollableText from '../../shared/RollableText'
import Changed from '../../shared/Changed'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const Spells = (props) => {
  const { spells, i, basePath } = props
  const { monsterName } = useDisplay()

  if (!spells) { return null }

  const getModifiers = () => {
    let items = []
    if (spells.saving_throw) {
      const dc = spells.saving_throw.dc
      items.push(
        <Changed path={basePath ? `${basePath}/saving_throw/dc` : null} key="dc">
          <span> DC {dc}</span>
        </Changed>
      )
    }
    if (spells.focus_points) {
      const fpPath = basePath ? `${basePath}/focus_points` : null
      if (spells.focus_points === 1) {
        items.push(<Changed path={fpPath} key="fp"><span> {spells.focus_points} Focus Point</span></Changed>)
      } else {
        items.push(<Changed path={fpPath} key="fp"><span> {spells.focus_points} Focus Points</span></Changed>)
      }
    }
    if (spells.notes) {
      spells.notes.forEach((note, j) => {
        items.push(
          <Changed path={basePath ? `${basePath}/notes/${j}` : null} key={`note-${j}`}>
            <span>{items.length > 0 ? ', ' : ' '}{note}</span>
          </Changed>
        )
      })
    }
    let label = `${spells.name} Attack`
    let spell_attack = null
    if (spells.spell_attack > 0) {
      spell_attack = spells.spell_attack
    }
    if (items.length === 0 && !spell_attack) {
      return null
    }
    return (
      <span>
        {items}
        {items.length > 0 && spell_attack ? <span>{', '}</span> : null}
        {spell_attack ? <span>attack{' '}
          <Changed path={basePath ? `${basePath}/spell_attack` : null}>
            <RollableText type="d20" label={`${monsterName} ${label}`} formula={`1d20${decoratedNumber(spell_attack)}`}>
              {decoratedNumber(spell_attack)}
            </RollableText>
          </Changed>
        </span> : null};
      </span>
    )
  }

  let modifiers = getModifiers()

  return (
    <div key={i}>
      <strong className="Monster__ability-name">{spells.name}{' '}</strong>
      {modifiers}{' '}
      {spells.spell_list.map((sl, j) => {
        return (<SpellList spell_list={sl} basePath={basePath ? `${basePath}/spell_list/${j}` : null} key={j} />)
      })}
    </div>
  )
}

export default Spells
