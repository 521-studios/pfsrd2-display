import React from 'react'
import Markdown from '../../shared/Markdown'
import Collapsible from '../../shared/Collapsible'
import Sections from './Sections'

const Family = ({ family }) => {
  if (!family || !family.name) return null

  return (
    <div className="Monster__family">
      <Collapsible headerClassName="Monster__family-title" header={family.name} bodyClassName="Monster__family-body">
        {family.text ? (
          <div className="Monster__family-text">
            <Markdown text={family.text} />
          </div>
        ) : null}
        <Sections sections={family.sections} />
      </Collapsible>
    </div>
  )
}

export default Family
