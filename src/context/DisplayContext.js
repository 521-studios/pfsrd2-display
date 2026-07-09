import React, { createContext, useContext } from 'react'
import { changeSources, isPathAdded, isPathChanged } from '../shared/patches'

const DisplayContext = createContext({
  onRoll: null,
  onLoadMonster: null,
  imageBaseUrl: '',
  monsterName: '',
  changedPaths: null,
  appliedTemplates: null,
})

export const DisplayProvider = DisplayContext.Provider

export function useDisplay() {
  return useContext(DisplayContext)
}

/**
 * Check if a JSON Pointer path was changed by a template patch.
 */
export function useIsChanged(path) {
  const { changedPaths } = useDisplay()
  return isPathChanged(changedPaths, path)
}

/**
 * Check if a JSON Pointer path was ADDED by a template (new entry), as
 * opposed to merely containing a modified field.
 */
export function useIsAdded(path) {
  const { changedPaths } = useDisplay()
  return isPathAdded(changedPaths, path)
}

export function useChangeSources(path) {
  const { changedPaths } = useDisplay()
  return changeSources(changedPaths, path)
}

export default DisplayContext
