import React from 'react'
import SpellList from './SpellList'
import RollableText from '../../shared/RollableText'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const Spells = (props) => {
  const { spells, i } = props
  const { monsterName } = useDisplay()

  if (!spells) { return null }

  const getModifiers = () => {
    let items = []
    if (spells.saving_throw) {
      items.push(` DC ${spells.saving_throw.dc}`)
    }
    if (spells.focus_points) {
      if (spells.focus_points == 1) {
        items.push(` ${spells.focus_points} Focus Point`)
      } else {
        items.push(` ${spells.focus_points} Focus Points`)
      }
    }
    if (spells.notes) {
      items.push.apply(items, spells.notes)
    }
    let label = `${spells.name} Attack`
    let spell_attack = null
    if (spells.spell_attack > 0) {
      spell_attack = spells.spell_attack
    }
    if (items.length == 0 && !spell_attack) {
      return null
    }
    return (
      <span>
        {items.join(', ')}
        {items.length > 0 && spell_attack ? <span>{', '}</span> : null}
        {spell_attack ? <span>attack{' '}
          <RollableText type="d20" label={`${monsterName} ${label}`} formula={`1d20${decoratedNumber(spell_attack)}`}>
            {decoratedNumber(spell_attack)}
          </RollableText>
        </span> : null};
      </span>
    )
  }

  let modifiers = getModifiers()

  return (
    <div key={i}>
      <strong>{spells.name}{' '}</strong>
      {modifiers}{' '}
      {spells.spell_list.map((sl, j) => {
        return (<SpellList spell_list={sl} key={j} />)
      })}
    </div>
  )
}

export default Spells
