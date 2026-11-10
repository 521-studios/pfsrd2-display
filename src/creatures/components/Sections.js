import React from 'react'
import Markdown from '../../shared/Markdown'
import Collapsible from '../../shared/Collapsible'
import Ability from './Ability'
import { useDisplay } from '../../context/DisplayContext'

const Sidebar = ({ section }) => {
  // sidebar_heading is the book's type banner ("Related Creatures"); name is the sidebar's own title.
  const typeLabel = section.sidebar_heading !== section.name ? section.sidebar_heading : null
  const typeClass = section.sidebar_type ? ` Monster__sidebar--${section.sidebar_type}` : ''

  return (
    <div className={`Monster__sidebar${typeClass}`}>
      <Collapsible
        headerClassName="Monster__sidebar-heading"
        header={<>{typeLabel ? <span className="Monster__sidebar-type">{typeLabel}</span> : null}{section.name}</>}
        bodyClassName="Monster__sidebar-body"
      >
        {section.text ? <Markdown text={section.text} /> : null}
      </Collapsible>
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
        <Collapsible headerClassName="Monster__section-title" header={section.name}>{content}</Collapsible>
      ) : content}
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
