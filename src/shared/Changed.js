import React from 'react'
import { useChangeSources, useIsChanged } from '../context/DisplayContext'

/**
 * Wraps children with a highlight element if the given path was modified by a template.
 * Use block={true} when wrapping div-level content (abilities, protections sections).
 * The tooltip names the template(s) responsible — stacked templates each list.
 */
const Changed = ({ path, block, children }) => {
  const changed = useIsChanged(path)
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
