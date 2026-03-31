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
      {uma.text ? <Markdown text={uma.text} /> : null}
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
