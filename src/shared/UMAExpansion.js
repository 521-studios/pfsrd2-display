import React from 'react'
import Markdown from './Markdown'

/**
 * Renders the expanded description of a universal monster ability.
 * Shows text, success/failure outcomes if present.
 */
const UMAExpansion = ({ uma }) => {
  if (!uma) return null

  return (
    <div className="Monster__uma-expansion">
      {uma.name ? <div className="Monster__uma-expansion-title"><strong className="Monster__ability-name">{uma.name}</strong></div> : null}
      {uma.frequency ? (
        <div><strong>Frequency</strong> <Markdown text={uma.frequency} /></div>
      ) : null}
      {uma.trigger ? (
        <div><strong>Trigger</strong> <Markdown text={uma.trigger} /></div>
      ) : null}
      {uma.requirement || uma.requirements ? (
        <div><strong>Requirements</strong> <Markdown text={uma.requirement || uma.requirements} /></div>
      ) : null}
      {uma.text ? <Markdown text={uma.text} /> : null}
      {uma.effect ? (
        <div>{uma.trigger || uma.frequency || uma.requirement || uma.requirements ? <strong>Effect </strong> : null}<Markdown text={uma.effect} /></div>
      ) : null}
      {uma.critical_success ? (
        <div className="Monster__ability_success">
          <strong>Critical Success</strong> {uma.critical_success}
        </div>
      ) : null}
      {uma.success ? (
        <div className="Monster__ability_success">
          <strong>Success</strong> {uma.success}
        </div>
      ) : null}
      {uma.failure ? (
        <div className="Monster__ability_success">
          <strong>Failure</strong> {uma.failure}
        </div>
      ) : null}
      {uma.critical_failure ? (
        <div className="Monster__ability_success">
          <strong>Critical Failure</strong> {uma.critical_failure}
        </div>
      ) : null}
    </div>
  )
}

export default UMAExpansion
