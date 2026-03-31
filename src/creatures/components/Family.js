import React, { useState } from 'react'
import Markdown from '../../shared/Markdown'
import Sections from './Sections'

const Family = ({ family }) => {
  const [open, setOpen] = useState(false)

  if (!family || !family.name) return null

  return (
    <div className="Monster__family">
      <div className="Monster__family-title Monster__collapsible" onClick={() => setOpen(!open)}>
        <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} />
        {family.name}
      </div>
      {open ? (
        <div className="Monster__family-body">
          {family.text ? (
            <div className="Monster__family-text">
              <Markdown text={family.text} />
            </div>
          ) : null}
          <Sections sections={family.sections} />
        </div>
      ) : null}
    </div>
  )
}

export default Family
