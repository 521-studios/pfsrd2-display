import React from 'react'
import Skill from './Skill'
import { comma } from '../../shared/utils'

const Skills = (props) => {
  const { skills } = props

  if (!skills) { return null }

  return (
    <div className='Monster__skills'>
      <strong className="Monster__heading">Skills </strong>
      {skills.map((s, i) => {
        return (
          <Skill skill={s} i={i} changePath={`/stat_block/statistics/skills/${i}/value`} key={i}>{comma(i, skills)}</Skill>
        )
      })}
    </div>
  )
}

export default Skills
