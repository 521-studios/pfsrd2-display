import React, { useState } from 'react'
import Markdown from '../../shared/Markdown'
import Ability from './Ability'
import { useDisplay } from '../../context/DisplayContext'

const Sidebar = ({ section }) => {
  const [open, setOpen] = useState(false)

  return (
    <div className="Monster__sidebar">
      <div className="Monster__sidebar-heading Monster__collapsible" onClick={() => setOpen(!open)}>
        <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} />
        {section.sidebar_heading || section.name}
      </div>
      {open ? (
        <div className="Monster__sidebar-body">
          {section.text ? <Markdown text={section.text} /> : null}
        </div>
      ) : null}
    </div>
  )
}

const Section = ({ section, isTopLevel }) => {
  if (!section) return null

  if (section.subtype === 'sidebar') {
    return <Sidebar section={section} />
  }

  const { monsterName } = useDisplay()
  const hasTitle = isTopLevel ? section.name !== monsterName : !!section.name
  const collapsible = hasTitle

  const [open, setOpen] = useState(!collapsible)

  const abilities = section.abilities

  const content = (
    <>
      {section.text ? (
        <div className="Monster__section-text">
          <Markdown text={section.text} />
        </div>
      ) : null}
      {abilities && abilities.length > 0 ? (
        <div className="Monster__abilities">
          {abilities.map((a, i) => (
            <Ability ability={a} i={i} key={i} />
          ))}
        </div>
      ) : null}
      {section.sections ? (
        <Sections sections={section.sections} />
      ) : null}
    </>
  )

  return (
    <div className="Monster__section">
      {hasTitle ? (
        <div className="Monster__section-title Monster__collapsible" onClick={() => setOpen(!open)}>
          <span className={`Monster__collapse-icon${open ? ' Monster__collapse-icon--open' : ''}`} />
          {section.name}
        </div>
      ) : null}
      {open ? content : null}
    </div>
  )
}

const Sections = ({ sections, topLevel }) => {
  if (!sections || sections.length === 0) return null

  return (
    <div className="Monster__sections">
      {sections.map((s, i) => (
        <Section section={s} isTopLevel={topLevel} key={i} />
      ))}
    </div>
  )
}

export default Sections
