import React from 'react'
import { useDisplay } from '../context/DisplayContext'

const RollableText = ({ type, label, formula, structuredFormula, children }) => {
  const { onRoll } = useDisplay()
  if (!onRoll) return <span>{children}</span>
  return (
    <span
      className="Monster__roll"
      onClick={() => onRoll({ type, label, formula, structuredFormula })}
    >
      {children}
    </span>
  )
}

export default RollableText
