import React from 'react'
import PropTypes from 'prop-types'
import Traits from '../creatures/components/Traits'
import Ability from '../creatures/components/Ability'
import Save from '../creatures/components/Save'
import Protection from '../creatures/components/Protection'
import Markdown from '../shared/Markdown'
import { DisplayProvider } from '../context/DisplayContext'

// Renders a hazard (or weather hazard) from its JSON. Hazards are flat under a
// `hazard` key (feat/spell convention), NOT nested under stat_block like creatures —
// so this reads doc.hazard and feeds the shared creature leaf components (Ability,
// Attack, Save, Protection) the objects that are the same shape, just unwrapped.
//
// Absence is meaningful: a haunt has no AC/HP to attack, so those lines are simply
// omitted (not rendered as unknown). Stealth is a DC (simple) OR a modifier (complex);
// render the field that's present.
export default function HazardStatBlock({ data, onRoll = () => {} }) {
  if (!data) return null
  const h = data.hazard || data
  const provider = { onRoll, onLoadMonster: () => {}, monsterName: h.name, changedPaths: null }

  const stealth = h.stealth || null
  const stealthText = stealth
    ? stealth.dc != null
      ? `DC ${stealth.dc}`
      : stealth.value != null
        ? signed(stealth.value)
        : null
    : null

  const saves = Array.isArray(h.saves) ? h.saves : []
  const immunities = protections(h.immunities)
  const weaknesses = protections(h.weaknesses)
  const resistances = protections(h.resistances)
  const attacks = Array.isArray(h.attacks) ? h.attacks : []
  const abilities = Array.isArray(h.abilities) ? h.abilities : []
  const hasDefense = h.ac != null || saves.length > 0 || h.hardness != null || h.hp != null

  return (
    <DisplayProvider value={provider}>
      <div className="Monster" data-testid="hazard-stat-block">
        <div className="Monster__header">
          <div className="Monster__name">{h.name}</div>
          {h.level != null ? <div className="Monster__level">Hazard {h.level}</div> : null}
        </div>
        <hr />
        <Traits traits={h.traits} />

        {stealthText ? (
          <div className="Monster__hazard-stealth">
            <strong className="Monster__heading">Stealth </strong>
            {stealthText}
            {stealth.proficiency ? ` (${stealth.proficiency})` : ''}
            {stealth.note ? ` ${stealth.note}` : ''}
          </div>
        ) : null}

        {h.description ? (
          <div className="Monster__section-text">
            <Markdown text={h.description} />
          </div>
        ) : null}

        {h.disable ? (
          <div className="Monster__hazard-disable">
            <strong className="Monster__heading">Disable </strong>
            <Markdown text={h.disable} />
          </div>
        ) : null}
        {h.reset ? (
          <div className="Monster__hazard-reset">
            <strong className="Monster__heading">Reset </strong>
            <Markdown text={h.reset} />
          </div>
        ) : null}

        {hasDefense ? (
          <div className="Monster__hazard-defense">
            {h.ac != null ? (
              <span className="Monster__ac">
                <strong className="Monster__heading">AC </strong>
                {h.ac}
                {saves.length ? '; ' : ''}
              </span>
            ) : null}
            {saves.map((s, i) => (
              <React.Fragment key={i}>
                {i > 0 ? ', ' : ''}
                <Save save={s} />
              </React.Fragment>
            ))}
            {h.hardness != null || h.hp != null ? (
              <div className="Monster__hitpoints">
                {h.hardness != null ? (
                  <span>
                    <strong className="Monster__heading">Hardness </strong>
                    {h.hardness}
                    {h.hardness_note ? ` ${h.hardness_note}` : ''}
                    {h.hp != null ? ', ' : ''}
                  </span>
                ) : null}
                {h.hp != null ? (
                  <span>
                    <strong className="Monster__heading">HP </strong>
                    {h.hp}
                    {h.hp_note ? ` ${h.hp_note}` : ''}
                    {h.bt != null ? ` (BT ${h.bt})` : ''}
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <ProtectionLine label="Immunities" items={immunities} />
        <ProtectionLine label="Weaknesses" items={weaknesses} />
        <ProtectionLine label="Resistances" items={resistances} />

        {h.routine ? (
          <div className="Monster__hazard-routine">
            <strong className="Monster__heading">Routine </strong>
            <Markdown text={h.routine} />
          </div>
        ) : null}

        {attacks.length ? (
          <div className="Monster__offense">
            {attacks.map((a, i) => <HazardAttack key={i} attack={a} />)}
          </div>
        ) : null}

        {abilities.length ? (
          <div className="Monster__abilities">
            {abilities.map((a, i) => <Ability key={i} ability={a} i={i} />)}
          </div>
        ) : null}
      </div>
    </DisplayProvider>
  )
}

// A hazard strike: hand-rendered rather than reusing the creature Attack leaf, which
// assumes a 3-entry multiple-attack-penalty bonus array. A hazard attacks once, so a
// single bonus must not render "+11 [undefined/undefined]".
function HazardAttack({ attack }) {
  const bonuses = (attack.bonus && Array.isArray(attack.bonus.bonuses) && attack.bonus.bonuses) || []
  const damage = Array.isArray(attack.damage) ? attack.damage : []
  const traits = Array.isArray(attack.traits) ? attack.traits : []
  const weapon = attack.weapon && attack.weapon !== attack.attack_type ? `${attack.weapon} ` : ''
  return (
    <div className="Monster__hazard-attack">
      <strong className="Monster__heading">{capitalize(attack.attack_type || attack.name || 'Attack')} </strong>
      {weapon}
      {bonuses.length ? signed(bonuses[0]) : ''}
      {traits.length ? ` (${traits.map((t) => (t.value ? `${t.name} ${t.value}` : t.name)).join(', ')})` : ''}
      {damage.length ? (
        <>
          {' '}
          <strong className="Monster__heading">Damage </strong>
          {damage.map((d, j) => `${j > 0 ? ' plus ' : ''}${d.formula || ''}${d.damage_type ? ` ${d.damage_type}` : ''}`).join('')}
        </>
      ) : null}
    </div>
  )
}

function ProtectionLine({ label, items }) {
  if (!items.length) return null
  return (
    <div className="Monster__protections">
      <strong className="Monster__heading">{label} </strong>
      {items.map((p, i) => (
        <React.Fragment key={i}>
          {i > 0 ? ', ' : ''}
          <Protection protection={p} />
        </React.Fragment>
      ))}
    </div>
  )
}

const protections = (v) => (Array.isArray(v) ? v : [])
const signed = (n) => (typeof n === 'number' && n >= 0 ? `+${n}` : `${n}`)
const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

HazardStatBlock.propTypes = {
  data: PropTypes.object,
  onRoll: PropTypes.func,
}
HazardAttack.propTypes = { attack: PropTypes.object.isRequired }
ProtectionLine.propTypes = { label: PropTypes.string, items: PropTypes.array }
