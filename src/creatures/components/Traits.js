import React from 'react'

const Traits = (props) => {
  const { traits } = props

  if (!traits) { return null }

  let renderTraits = traitlist(traits)

  return (
    <div className='Monster__traits'>
      {renderTraits.map((trait, i) => {
        let name = trait.name
        return (
          <div
            key={i}
            className={`Monster__trait Monster__trait--${trait.class}`}
          >
            {name}
          </div>
        )
      })}
    </div>
  )
}

const isRarity = trait => {
  const rarity = ["common", "uncommon", "rare", "unique"]
  for (let i = 0; i < rarity.length; i++) {
    if (trait.classes.includes(rarity[i])) {
      return rarity[i]
    }
  }
  return null
}

const traitlist = traits => {
  let newTraits = []
  let sizeTraits = []
  let rarityTraits = []
  let alignmentTraits = []
  if (!traits) {
    return []
  }
  traits.forEach(trait => {
    if (trait.classes.includes('alignment')) {
      alignmentTraits.push(trait)
    } else if (trait.classes.includes('size')) {
      sizeTraits.push({ 'name': trait.name, 'class': 'size', 'trait': trait })
    } else if (isRarity(trait)) {
      rarityTraits.push({ 'name': trait.name, 'class': isRarity(trait), 'trait': trait })
    } else {
      newTraits.push({ 'name': trait.name, 'class': 'general', 'trait': trait })
    }
  })

  let alignmentAbbrev = alignmentTraits.map(t => t.name.split(' ').map(n => n.charAt(0)).join('')).join('')
  alignmentAbbrev = alignmentAbbrev === "A" ? "Any" : alignmentAbbrev
  let renderTraits = []
  rarityTraits.forEach(t => { renderTraits.push(t) })
  if (alignmentAbbrev) {
    renderTraits.push({ 'name': alignmentAbbrev, 'class': 'alignment' })
  }
  sizeTraits.forEach(t => { renderTraits.push(t) })
  newTraits.forEach(t => { renderTraits.push(t) })
  return renderTraits
}

export default Traits
