import React from 'react'
import Traits from '../creatures/components/Traits'
import Markdown from '../shared/Markdown'

// Renders any item/equipment JSON handed to it: a pristine pfsrd2-data
// entry, a constructed/derived snapshot (runes applied, scroll+spell, etc.),
// or a hand-built custom. Data-as-props like CreatureStatBlock -- no
// fetching, no assumption the JSON matches a dataset entry. Rarity isn't a
// field: it's just one of the trait badges (Traits already classifies
// common/uncommon/rare/unique via trait.classes), so it renders for free.
const ItemCard = ({ data, masked, maskLabel }) => {
  if (!data) { return null }

  if (masked) {
    return (
      <div className='Monster Monster--masked'>
        <div className='Monster__header'>
          <div className='Monster__name Monster__name--masked'>{maskLabel || 'Unidentified Item'}</div>
        </div>
      </div>
    )
  }

  // Constructed/derived snapshots and hand-built customs may omit the
  // stat_block wrapper and provide these fields at the top level.
  const stat_block = data.stat_block || data
  const { level, price, bulk, traits, text } = stat_block

  return (
    <div className='Monster'>
      <div className='Monster__header'>
        <div className='Monster__name'>{data.name}</div>
        {level !== undefined && level !== null ? (
          <div className='Monster__level'>Item {level}</div>
        ) : null}
      </div>

      <hr />
      <Traits traits={traits} />

      {price ? (
        <div className='Monster__price'>
          <strong className="Monster__heading">Price </strong>
          {price.text}
        </div>
      ) : null}

      {bulk && bulk.text ? (
        <div className='Monster__bulk'>
          <strong className="Monster__heading">Bulk </strong>
          {bulk.text}
        </div>
      ) : null}

      {text ? (
        <div className='Monster__section-text'>
          <Markdown text={text} />
        </div>
      ) : null}
    </div>
  )
}

export default ItemCard
