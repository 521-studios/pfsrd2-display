import React from 'react'
import { useDisplay } from '../../context/DisplayContext'

const MonsterCard = props => {
  const { image, name } = props
  const { imageBaseUrl } = useDisplay()

  if (!image) {
    return null
  }

  const portrait = `${imageBaseUrl || '/api/pfsrd2/images'}/Monsters/${image}`

  return (
    <div className='MonsterCard'>
      <a href={portrait} target='_blank' rel='noopener noreferrer'>
        <img
          src={portrait}
          className='MonsterCard__portrait MonsterCard__portrait--party'
        />
      </a>
      <div className='MonsterCard__name'>{name}</div>
    </div>
  )
}

export default MonsterCard
