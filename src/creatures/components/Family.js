import React, { useId, useState } from 'react'
import Markdown from '../../shared/Markdown'
import CollapsibleHeader from '../../shared/CollapsibleHeader'
import Sections from './Sections'

const Family = ({ family }) => {
  const [open, setOpen] = useState(false)
  const bodyId = useId()

  if (!family || !family.name) return null

  return (
    <div className="Monster__family">
      <CollapsibleHeader className="Monster__family-title" open={open} onToggle={() => setOpen(!open)} controls={bodyId}>
        {family.name}
      </CollapsibleHeader>
      {open ? (
        <div className="Monster__family-body" id={bodyId}>
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
