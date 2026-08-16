import React from 'react'
import Action from './Action'
import RollableText from '../../shared/RollableText'
import Changed from '../../shared/Changed'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const getTraits = (attack) => {
  if (attack.traits && attack.traits.length > 0) {
    return ` (${attack.traits.map(t => t.value ? `${t.name} ${t.value}` : t.name).join(', ')}),`
  }
  return ""
}

// The roll label for one damage entry: "{weapon}: ({types}) {notes}". Pure — it
// returns the string rather than writing `d.label` onto the (shared, prop) damage
// object, which mutated props during render (efi). Exported for unit testing.
export const damageLabel = (attack, d) => {
  const types = []
  if (d.persistent) types.push("persistent")
  if (d.damage_type) types.push(d.damage_type)
  if (d.splash) types.push("splash")
  const parts = [`${attack.weapon}:`]
  if (types.length > 0) parts.push(`(${types.join(" ")})`)
  if (d.notes) parts.push(d.notes)
  return parts.join(" ")
}

const Attack = (props) => {
  const { attack, i } = props
  const { monsterName } = useDisplay()

  if (!attack) { return null }

  let traits = getTraits(attack)

  const getDamageStructuredFormula = () => {
    let formulas = []
    let structured_formula = { name: `${monsterName} ${attack.weapon} damage`, formulas: formulas }
    for (var j = 0; j < attack.damage.length; j++) {
      let damage = attack.damage[j]
      let formula = {}
      if (damage.effect) {
        formula.label = damage.effect
      } else {
        let label_parts = []
        if (damage.persistent) {
          label_parts.push("persistent")
          formula.note = damage.formula
        } else {
          formula.formula = damage.formula
        }
        label_parts.push(damage.damage_type)
        if (damage.splash) {
          label_parts.push("splash")
          formula.note = damage.formula
        }
        if (damage.notes) {
          formula.note = damage.notes
        }
        formula.label = label_parts.join(" ")
      }
      formulas.push(formula)
    }
    return structured_formula
  }

  const getDamage = () => {
    if (attack.damage && attack.damage.length > 0) {
      const sf = getDamageStructuredFormula()
      const label = `${monsterName} ${attack.weapon} Damage`
      return (
        <React.Fragment>
          <strong className="Monster__ability-label"> <RollableText type="complex" label={label} structuredFormula={sf}>Damage</RollableText></strong>&nbsp;
          {attack.damage.map((d, j) => {
            const dmgBasePath = `/stat_block/offense/offensive_actions/${i}/attack/damage/${j}`
            return (
              <Changed path={dmgBasePath} key={j}>
                <span>
                  {j === 0 ? null : <React.Fragment>, </React.Fragment>}
                  {d.formula ? <RollableText type="formula" label={damageLabel(attack, d)} formula={d.formula}>{d.formula}</RollableText> : null}
                  {d.effect ? <React.Fragment>{' '}{d.effect}</React.Fragment> : null}
                  {d.persistent ? <React.Fragment>{' '}persistent</React.Fragment> : null}
                  {d.splash ? <React.Fragment>{' '}splash</React.Fragment> : null}
                  {d.damage_type ? <React.Fragment>{' '}{d.damage_type}</React.Fragment> : null}
                  {d.notes ? <React.Fragment>{' '}{d.notes}</React.Fragment> : null}
                </span>
              </Changed>
            )
          })}
        </React.Fragment>
      )
    }
    return ""
  }

  const bonusBasePath = `/stat_block/offense/offensive_actions/${i}/attack/bonus/bonuses`

  const getBonuses = () => {
    if (attack.bonus) {
      return (
        <Changed path={bonusBasePath}>
          <RollableText type="d20" label={`${attack.name} ${attack.weapon} (1st attack)`} formula={`1d20${decoratedNumber(attack.bonus.bonuses[0])}`}>
            {decoratedNumber(attack.bonus.bonuses[0])}
          </RollableText>
          {' '}
          [<RollableText type="d20" label={`${attack.name} ${attack.weapon} (2nd attack)`} formula={`1d20${decoratedNumber(attack.bonus.bonuses[1])}`}>
            {decoratedNumber(attack.bonus.bonuses[1])}
          </RollableText>/<RollableText type="d20" label={`${attack.name} ${attack.weapon} (3rd attack)`} formula={`1d20${decoratedNumber(attack.bonus.bonuses[2])}`}>
            {decoratedNumber(attack.bonus.bonuses[2])}
          </RollableText>]
        </Changed>
      )
    }
    return ""
  }

  const requirements = () => {
    if (!attack.requirement) {
      return null
    }
    return (
      <React.Fragment>
        <strong className="Monster__ability-label">Requirements</strong>&nbsp;
        {attack.requirement};&nbsp;
        <strong className="Monster__ability-label">Effect</strong>&nbsp;
      </React.Fragment>
    )
  }

  let damage = getDamage()
  let bonuses = getBonuses()
  let text = attack.bonus ? null : ` ${attack.text}`
  const action = attack.action_type || attack.action

  return (
    <div key={i}>
      <strong className="Monster__ability-name">{attack.name}{' '}</strong>
      {action ? <Action name={action.name} /> : null}
      {requirements()}
      {attack.weapon} {bonuses}
      {traits}
      {damage}
      {text ? <span dangerouslySetInnerHTML={{ __html: text }} /> : null}
    </div>
  )
}

export default Attack
