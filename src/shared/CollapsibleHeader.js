import React from 'react'

// A native button, so Enter/Space and focus come from the browser. The body is
// unmounted while collapsed, so aria-controls is only set when it exists.
const CollapsibleHeader = ({ className, open, onToggle, controls, children }) => (
  <button
    type="button"
    className={`${className} Monster__collapsible`}
    aria-expanded={open}
    aria-controls={open ? controls : undefined}
    onClick={onToggle}
  >
    <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} aria-hidden="true" />
    {children}
  </button>
)

export default CollapsibleHeader
