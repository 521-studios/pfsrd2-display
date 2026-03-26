import React, { createContext, useContext } from 'react'
import { isPathChanged, isArrayAppended } from '../shared/patches'

const DisplayContext = createContext({
  onRoll: null,
  onLoadMonster: null,
  imageBaseUrl: '',
  monsterName: '',
  changedPaths: null,
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
 * Check if an array had items appended via a template patch.
 */
export function useIsArrayAppended(arrayPath) {
  const { changedPaths } = useDisplay()
  return isArrayAppended(changedPaths, arrayPath)
}

export default DisplayContext
