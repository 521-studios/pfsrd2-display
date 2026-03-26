import React from 'react'
import { DisplayProvider } from '../context/DisplayContext'
import CreatureStatBlockV1_2 from './CreatureStatBlockV1_2'
import CreatureStatBlockV1_3 from './CreatureStatBlockV1_3'

const getSchemaVersion = (data) => {
  if (data.schema_version) {
    return String(data.schema_version)
  }
  // Default to 1.2 for legacy data
  return '1.2'
}

const CreatureStatBlock = ({ data, onRoll, onLoadMonster, imageBaseUrl }) => {
  if (!data) { return null }

  const contextValue = {
    onRoll: onRoll || null,
    onLoadMonster: onLoadMonster || null,
    imageBaseUrl: imageBaseUrl || '',
    monsterName: data.name || '',
  }

  const version = getSchemaVersion(data)
  let Renderer

  if (version.startsWith('1.3') || version.startsWith('1.4')) {
    Renderer = CreatureStatBlockV1_3
  } else {
    Renderer = CreatureStatBlockV1_2
  }

  return (
    <DisplayProvider value={contextValue}>
      <Renderer data={data} />
    </DisplayProvider>
  )
}

export default CreatureStatBlock
