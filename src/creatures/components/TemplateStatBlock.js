import React, { useState } from 'react'
import Markdown from '../../shared/Markdown'
import Action from './Action'

const AdjustmentsTable = ({ adjustments }) => {
  if (!adjustments || adjustments.length === 0) return null

  const skip = new Set(['type', 'subtype', 'level'])
  const columns = []
  for (const adj of adjustments) {
    for (const key of Object.keys(adj)) {
      if (!skip.has(key) && !columns.includes(key)) {
        columns.push(key)
      }
    }
  }

  if (columns.length === 0) return null

  return (
    <table className="Monster__template-adjustments">
      <thead>
        <tr>
          <th>Level</th>
          {columns.map((col) => (
            <th key={col}>{col.charAt(0).toUpperCase() + col.slice(1)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {adjustments.map((adj, i) => (
          <tr key={i}>
            <td>{adj.level}</td>
            {columns.map((col) => (
              <td key={col}>{adj[col] || '—'}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const TemplateAbility = ({ ability }) => {
  if (!ability) return null
  const action = ability.action_type || ability.action
  return (
    <div className="Monster__template-ability">
      <strong className="Monster__ability-name">{ability.name}</strong>
      {action ? <span>{' '}<Action name={action.name} /></span> : null}
      {ability.text ? <span>{' '}<Markdown text={ability.text} /></span> : null}
    </div>
  )
}

// Partition a template/family rules object for rendering: text-only change
// lines (concatenated so list items render as one <ul>), changes carrying
// their own embedded abilities, and the template-level ability pool
// (Catfolk's Low-Light Vision lives at mt.abilities, granted by a text-only
// "Add the following abilities." change — it must render even though no
// change embeds it).
export const partitionTemplateRules = (mt) => {
  const changes = (mt && mt.changes) || []
  const textChanges = []
  const abilityChanges = []
  for (const c of changes) {
    if (c.abilities && c.abilities.length > 0) {
      abilityChanges.push(c)
    } else if (c.text) {
      textChanges.push(c.text)
    }
  }
  return {
    combinedText: textChanges.join('\n'),
    abilityChanges,
    poolAbilities: (mt && mt.abilities) || [],
  }
}

const TemplateChanges = ({ combinedText, abilityChanges, poolAbilities }) => {
  const hasPool = poolAbilities && poolAbilities.length > 0
  if (!combinedText && abilityChanges.length === 0 && !hasPool) return null

  return (
    <div className="Monster__template-changes">
      {combinedText ? <Markdown text={combinedText} /> : null}
      {hasPool ? (
        // Template-level ability pool (Catfolk's Low-Light Vision): the
        // granting instruction is one of the text changes above ("Add the
        // following abilities."), so the pool renders directly under the
        // combined text, matching the published layout.
        <div className="Monster__template-abilities">
          {poolAbilities.map((a, i) => (
            <TemplateAbility ability={a} key={i} />
          ))}
        </div>
      ) : null}
      {abilityChanges.map((c, i) => (
        <div key={i} className="Monster__template-change">
          <Markdown text={c.text || '- Add the following abilities.'} />
          <div className="Monster__template-abilities">
            {c.abilities.map((a, j) => (
              <TemplateAbility ability={a} key={j} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const TemplateStatBlock = ({ template }) => {
  const [open, setOpen] = useState(false)

  if (!template) return null

  // Families are the remastered rules carrier for several transforms and
  // apply through the same endpoint — render their rules identically.
  const mt = template.monster_template || template.monster_family
  const adjustments = mt ? mt.adjustments || [] : []
  const rules = partitionTemplateRules(mt)

  return (
    <div className="Monster__template">
      <div className="Monster__template-title Monster__collapsible" onClick={() => setOpen(!open)}>
        <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} />
        {template.name} Template
      </div>
      {open ? (
        <div className="Monster__template-body">
          {template.text ? (
            <div className="Monster__template-description">
              <Markdown text={template.text} />
            </div>
          ) : null}
          <TemplateChanges {...rules} />
          <AdjustmentsTable adjustments={adjustments} />
          {template.sources && template.sources.length > 0 ? (
            <div className="Monster__template-source">
              Source: {template.sources[0].name}
              {template.sources[0].page ? `, pg. ${template.sources[0].page}` : ''}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

export default TemplateStatBlock
