import React, { createContext, useContext } from 'react'

const DisplayContext = createContext({
  onRoll: null,
  onLoadMonster: null,
  imageBaseUrl: '',
  monsterName: '',
})

export const DisplayProvider = DisplayContext.Provider

export function useDisplay() {
  return useContext(DisplayContext)
}

export default DisplayContext
