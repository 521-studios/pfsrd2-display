import React from 'react'
import Modifiers from './Modifiers'
import RollableText from '../../shared/RollableText'
import { useDisplay } from '../../context/DisplayContext'
import { decoratedNumber } from '../../shared/utils'

const Skill = (props) => {
  const { skill, i, children } = props
  const { monsterName } = useDisplay()

  if (!skill) { return null }

  return (
    <span className='Monster__skill' key={i}>
      {skill.name}<Modifiers modifiers={skill.modifiers} />&nbsp;
      <RollableText type="d20" label={`${monsterName} ${skill.name}`} formula={`1d20${decoratedNumber(skill.value)}`}>
        {decoratedNumber(skill.value)}
      </RollableText>{children}
    </span>
  )
}

export default Skill
