import React from 'react'
import PropTypes from 'prop-types'
import Traits from '../creatures/components/Traits'
import Markdown from '../shared/Markdown'

// Renders any item/equipment JSON handed to it: a pristine pfsrd2-data
// entry, a constructed/derived snapshot (runes applied, scroll+spell, etc.),
// or a hand-built custom. Data-as-props like CreatureStatBlock -- no
// fetching, no assumption the JSON matches a dataset entry. Rarity isn't a
// field: it's just one of the trait badges (Traits already classifies
// common/uncommon/rare/unique via trait.classes), so it renders for free.
//
// `masked` hides the item's identity for an unidentified magic item: when
// true, ONLY `maskLabel` is rendered and none of the real fields reach the
// DOM (fail closed). `maskLabel` is inert unless `masked` is true.
//
// Some items carry `stat_block.variants` (e.g. a Striking rune: Striking /
// Greater / Major, each with its own level + price). When there's more than one,
// a variant selector renders and the chosen variant's name/level/price override
// the base. Controlled: `variant` is the selected index (default 0),
// `onVariantChange(index)` fires on change — the consumer owns/persists the pick.
const ItemCard = ({ data, masked, maskLabel, variant = 0, onVariantChange }) => {
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
  const { bulk, traits, text } = stat_block
  const variants = Array.isArray(stat_block.variants) ? stat_block.variants : []
  // The selected variant overrides name/level/price; the rest is shared. Clamp so
  // an out-of-range index falls back to the base rather than crashing.
  const chosen = variants[variant]
  const name = chosen ? chosen.name : data.name
  const level = chosen ? chosen.level : stat_block.level
  const price = chosen ? chosen.price : stat_block.price

  return (
    <div className='Monster'>
      <div className='Monster__header'>
        <div className='Monster__name'>{name}</div>
        {level !== undefined && level !== null ? (
          <div className='Monster__level'>Item {level}</div>
        ) : null}
      </div>

      {variants.length > 1 ? (
        <div className='Monster__variants'>
          <select
            className='Monster__variant-select'
            aria-label='variant'
            value={variant}
            disabled={!onVariantChange}
            onChange={(e) => onVariantChange && onVariantChange(Number(e.target.value))}
          >
            {variants.map((v, i) => (
              <option key={i} value={i}>
                {v.name}{v.level !== undefined && v.level !== null ? ` (Lvl ${v.level})` : ''}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <hr />
      <Traits traits={traits} />

      {price && price.text ? (
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

ItemCard.propTypes = {
  data: PropTypes.object.isRequired,
  masked: PropTypes.bool,
  maskLabel: PropTypes.string,
  variant: PropTypes.number, // selected index into stat_block.variants
  onVariantChange: PropTypes.func // (index) => void; enables the variant selector
}

export default ItemCard
