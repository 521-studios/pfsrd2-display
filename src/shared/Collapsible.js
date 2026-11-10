import React, { useId, useState } from 'react'

// A native button, so Enter/Space and focus come from the browser. The body is
// unmounted while collapsed, so aria-controls is only set when it exists.
const Collapsible = ({ headerClassName, header, bodyClassName, defaultOpen = false, children }) => {
  const [open, setOpen] = useState(defaultOpen)
  const bodyId = useId()

  return (
    <>
      <button
        type="button"
        className={`${headerClassName} Monster__collapsible`}
        aria-expanded={open}
        aria-controls={open ? bodyId : undefined}
        onClick={() => setOpen(!open)}
      >
        <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} aria-hidden="true" />
        {header}
      </button>
      {open ? <div className={bodyClassName} id={bodyId}>{children}</div> : null}
    </>
  )
}

export default Collapsible
