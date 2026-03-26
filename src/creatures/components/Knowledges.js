import React from 'react'

const Knowledges = (props) => {
  const { knowledges } = props

  if (!knowledges) { return null }

  let text = knowledges.map(k => {
    let name = k.name

    if (k.skills) {
      let skills = k.skills.map(s => {
        return s.name
      }).join(", ")
      name += ` (${skills})`
    }

    let dc = k.dc
    name += ` DC ${dc}`
    return name
  }).join("; ")

  return (
    <div className='Monster__knowledge'>
      <strong>Recall Knowledge</strong>
      &nbsp;{text}
    </div>
  )
}

export default Knowledges
