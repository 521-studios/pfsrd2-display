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
      <strong>{ability.name}</strong>
      {action ? <span>{' '}<Action name={action.name} /></span> : null}
      {ability.text ? <span>{' '}<Markdown text={ability.text} /></span> : null}
    </div>
  )
}

const TemplateChange = ({ change }) => {
  const hasAbilities = change.abilities && change.abilities.length > 0

  if (hasAbilities) {
    // For ability changes, show a short label then render abilities individually
    return (
      <div className="Monster__template-change">
        <Markdown text="- Add the following abilities." />
        <div className="Monster__template-abilities">
          {change.abilities.map((a, i) => (
            <TemplateAbility ability={a} key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="Monster__template-change">
      <Markdown text={change.text} />
    </div>
  )
}

const TemplateStatBlock = ({ template }) => {
  const [open, setOpen] = useState(false)

  if (!template) return null

  const mt = template.monster_template
  const changes = mt ? mt.changes || [] : []
  const adjustments = mt ? mt.adjustments || [] : []

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
          {changes.length > 0 ? (
            <div className="Monster__template-changes">
              {changes.map((c, i) => (
                <TemplateChange change={c} key={i} />
              ))}
            </div>
          ) : null}
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
