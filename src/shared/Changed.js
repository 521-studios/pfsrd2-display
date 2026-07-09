import React from 'react'
import { useChangeSources, useIsAdded, useIsChanged } from '../context/DisplayContext'

/**
 * Wraps children with a highlight element if the given path was modified by a template.
 * Use block={true} when wrapping div-level content (abilities, protections sections).
 * Use added={true} for whole-entry wrappers that must only highlight when the
 * entry itself was ADDED — a modified field inside an existing entry then
 * relies on its own inner Changed wrapper instead of lighting the whole block.
 * The tooltip names the template(s) responsible — stacked templates each list.
 */
const Changed = ({ path, block, added, children }) => {
  const changedAny = useIsChanged(path)
  const addedOnly = useIsAdded(path)
  const changed = added ? addedOnly : changedAny
  const sources = useChangeSources(path)
  if (!changed) return children
  const Tag = block ? 'div' : 'span'
  const title = sources.length > 0
    ? `Modified by ${sources.join(', ')}`
    : 'Modified by template'
  return (
    <Tag className={`Monster__changed${block ? ' Monster__changed--block' : ''}`} title={title}>
      {children}
    </Tag>
  )
}

export default Changed
