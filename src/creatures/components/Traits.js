import React from 'react'
import Changed from '../../shared/Changed'

const Traits = (props) => {
  const { traits, creatureTypes } = props

  if (!traits && !creatureTypes) { return null }

  let renderTraits = traitlist(traits)

  // creature_types are strings like "Animal", "Ghost", "Spirit", "Undead"
  // Render them as general trait badges after the regular traits
  // The original traits from the data also contain the base creature type,
  // so only add creature_types that aren't already in the traits list
  const traitNames = new Set(renderTraits.map(t => t.name))
  const extraTypes = (creatureTypes || [])
    .filter(ct => !traitNames.has(ct))
    .map(ct => ({ name: ct, class: 'general' }))

  return (
    <div className='Monster__traits'>
      {renderTraits.map((trait, i) => (
        <div
          key={i}
          className={`Monster__trait Monster__trait--${trait.class}`}
        >
          {trait.name}
        </div>
      ))}
      {extraTypes.map((ct, i) => (
        <Changed key={`ct-${i}`} path="/stat_block/creature_type/creature_types">
          <div className={`Monster__trait Monster__trait--${ct.class}`}>
            {ct.name}
          </div>
        </Changed>
      ))}
    </div>
  )
}

const isRarity = trait => {
  const rarity = ["common", "uncommon", "rare", "unique"]
  const classes = trait.classes || []
  for (let i = 0; i < rarity.length; i++) {
    if (classes.includes(rarity[i])) {
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
    // template-added badges may carry no classes at all — the parser's
    // remove_empty_fields strips empty arrays (Catfolk badge crashed the
    // stat block here); classless badges render as general traits
    const classes = trait.classes || []
    if (classes.includes('alignment')) {
      alignmentTraits.push(trait)
    } else if (classes.includes('size')) {
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
