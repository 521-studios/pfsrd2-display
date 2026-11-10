import React, { useId, useState } from 'react'
import Markdown from '../../shared/Markdown'
import CollapsibleHeader from '../../shared/CollapsibleHeader'
import Ability from './Ability'
import { useDisplay } from '../../context/DisplayContext'

const Sidebar = ({ section }) => {
  const [open, setOpen] = useState(false)
  const bodyId = useId()
  // sidebar_heading is the book's type banner ("Related Creatures"); name is the sidebar's own title.
  const typeLabel = section.sidebar_heading !== section.name ? section.sidebar_heading : null
  const typeClass = section.sidebar_type ? ` Monster__sidebar--${section.sidebar_type}` : ''

  return (
    <div className={`Monster__sidebar${typeClass}`}>
      <CollapsibleHeader className="Monster__sidebar-heading" open={open} onToggle={() => setOpen(!open)} controls={bodyId}>
        {typeLabel ? <span className="Monster__sidebar-type">{typeLabel}</span> : null}
        {section.name}
      </CollapsibleHeader>
      {open ? (
        <div className="Monster__sidebar-body" id={bodyId}>
          {section.text ? <Markdown text={section.text} /> : null}
        </div>
      ) : null}
    </div>
  )
}

const Section = ({ section, isTopLevel }) => {
  if (!section) return null
  if (section.subtype === 'sidebar') return <Sidebar section={section} />
  return <ProseSection section={section} isTopLevel={isTopLevel} />
}

const ProseSection = ({ section, isTopLevel }) => {
  const { monsterName } = useDisplay()
  const hasTitle = isTopLevel ? section.name !== monsterName : !!section.name
  const collapsible = hasTitle

  const [open, setOpen] = useState(!collapsible)
  const bodyId = useId()

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
        <CollapsibleHeader className="Monster__section-title" open={open} onToggle={() => setOpen(!open)} controls={bodyId}>
          {section.name}
        </CollapsibleHeader>
      ) : null}
      {open ? <div id={bodyId}>{content}</div> : null}
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
