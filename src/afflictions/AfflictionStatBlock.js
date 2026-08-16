import React from 'react'
import PropTypes from 'prop-types'
import Traits from '../creatures/components/Traits'
import Modifiers from '../creatures/components/Modifiers'
import Markdown from '../shared/Markdown'
import { DisplayProvider } from '../context/DisplayContext'

// Renders an affliction (curse or disease) from its JSON. Afflictions are flat under
// an `affliction` key (feat/spell/hazard convention). Purpose-built rather than reusing
// the creature-inline Affliction component: an affliction DOCUMENT's stages carry
// `stage`/`effect`/`duration` (NOT the creature `.text` shape), the save may be a DC,
// a text-only formula, or absent, and the level may be a `level_text` ("Varies").
//
// A disease is a staged progression (stages); a curse is usually a standing `effect`.
export default function AfflictionStatBlock({ data }) {
  if (!data) return null
  const a = data.affliction || data
  const kind = capitalize(a.affliction_type || 'affliction') // "Curse" | "Disease"
  const levelLabel = a.level != null ? `${kind} ${a.level}` : a.level_text ? `${kind} ${a.level_text}` : kind
  const stages = Array.isArray(a.stages) ? a.stages : []
  const save = a.saving_throw || null

  return (
    <DisplayProvider value={{ monsterName: a.name, onRoll: () => {}, onLoadMonster: () => {}, changedPaths: null }}>
      <div className="Monster" data-testid="affliction-stat-block">
        <div className="Monster__header">
          <div className="Monster__name">{a.name}</div>
          <div className="Monster__level">{levelLabel}</div>
        </div>
        <hr />
        <Traits traits={a.traits} />

        {a.description ? (
          <div className="Monster__section-text">
            <Markdown text={a.description} />
          </div>
        ) : null}

        <div className="Monster__affliction-body">
          {save ? (
            <Line label="Saving Throw">
              {save.dc != null ? `${save.save_type} DC ${save.dc}` : save.text || save.save_type}
              <Modifiers modifiers={save.modifiers} />
            </Line>
          ) : null}
          {a.onset ? <Line label="Onset"><Markdown text={a.onset} /></Line> : null}
          {a.maximum_duration ? <Line label="Maximum Duration"><Markdown text={a.maximum_duration} /></Line> : null}
          {a.usage ? <Line label="Usage"><Markdown text={a.usage} /></Line> : null}
          {a.tempted_curse ? <Line label="Tempted Curse"><Markdown text={a.tempted_curse} /></Line> : null}
          {a.effect ? <Line label="Effect"><Markdown text={a.effect} /></Line> : null}

          {stages.map((s, i) => (
            <Line key={i} label={s.name || `Stage ${s.stage ?? i + 1}`}>
              <Markdown text={s.effect || ''} />
              {s.duration ? ` (${s.duration})` : ''}
            </Line>
          ))}

          {a.special ? <Line label="Special"><Markdown text={a.special} /></Line> : null}
        </div>
      </div>
    </DisplayProvider>
  )
}

// One labelled stat-block line (Saving Throw, Onset, Stage N, …).
function Line({ label, children }) {
  return (
    <div className="Monster__affliction-line">
      <strong className="Monster__ability-label">{label}</strong> {children}
    </div>
  )
}

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s)

AfflictionStatBlock.propTypes = { data: PropTypes.object }
Line.propTypes = { label: PropTypes.string, children: PropTypes.node }
