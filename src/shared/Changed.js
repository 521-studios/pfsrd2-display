import React from 'react'
import { useIsChanged } from '../context/DisplayContext'

/**
 * Wraps children with a highlight element if the given path was modified by a template.
 * Use block={true} when wrapping div-level content (abilities, protections sections).
 */
const Changed = ({ path, block, children }) => {
  const changed = useIsChanged(path)
  if (!changed) return children
  const Tag = block ? 'div' : 'span'
  return (
    <Tag className={`Monster__changed${block ? ' Monster__changed--block' : ''}`} title="Modified by template">
      {children}
    </Tag>
  )
}

export default Changed
