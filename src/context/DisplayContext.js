import React, { createContext, useContext } from 'react'
import { isPathChanged } from '../shared/patches'

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

export default DisplayContext
