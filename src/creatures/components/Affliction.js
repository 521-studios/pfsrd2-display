import React from 'react'
import Action from './Action'
import Markdown from '../../shared/Markdown'
import Modifiers from './Modifiers'

const getTraits = (affliction) => {
  if (affliction.traits && affliction.traits.length > 0) {
    return ` (${affliction.traits.map(t => t.name).join(', ')})`
  }
  return ""
}

const Affliction = (props) => {
  const { affliction, i } = props

  if (!affliction) { return null }

  // The inner (post-separator) content of a labelled Markdown section — a null name
  // renders no label, matching the original renderSection.
  const sectionInner = (name, content) => (
    <React.Fragment>
      {name ? <strong className="Monster__ability-label">{name}</strong> : null}
      {' '}
      <Markdown text={content} />
    </React.Fragment>
  )

  // Detail segments trailing the name/traits, in JSX order: context, saving throw, the
  // labelled sections, each stage, special, then the closing text. Each present segment
  // is separated by "; " (the first by " "). Built as one ordered list so the separator
  // comes from position, not a mutated closure variable (2ne).
  const details = []
  if (affliction.context) details.push(sectionInner(null, affliction.context))
  if (affliction.saving_throw) {
    details.push(
      <React.Fragment>
        <strong className="Monster__ability-label">Saving Throw</strong>{' '}
        <span>
          {affliction.saving_throw.save_type} DC {affliction.saving_throw.dc}
          <Modifiers modifiers={affliction.saving_throw.modifiers} />
        </span>
      </React.Fragment>,
    )
  }
  if (affliction.requirements) details.push(sectionInner("Requirements", affliction.requirements))
  if (affliction.effect) details.push(sectionInner("Effect", affliction.effect))
  if (affliction.onset) details.push(sectionInner("Onset", affliction.onset))
  if (affliction.maximum_duration) details.push(sectionInner("Maximum Duration", affliction.maximum_duration))
  if (affliction.stages) {
    affliction.stages.forEach((s, j) =>
      details.push(
        <React.Fragment>
          <strong className="Monster__ability-label">Stage {j + 1}</strong>{' '}{s.text}
        </React.Fragment>,
      ),
    )
  }
  if (affliction.special) details.push(sectionInner("Special", affliction.special))
  if (affliction.text) details.push(sectionInner(null, affliction.text))

  let traits = getTraits(affliction)
  const action = affliction.action_type || affliction.action

  return (
    <div key={i}>
      <strong className="Monster__ability-name">{affliction.name}{' '}</strong>
      {action ? <Action name={action.name} /> : null}
      {traits}
      {' '}{details.map((inner, k) => (
        <span key={k}>{k === 0 ? ' ' : '; '}{inner}</span>
      ))}
    </div>
  )
}

export default Affliction
