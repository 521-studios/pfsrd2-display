import React, { useRef } from 'react'
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
// Greater / Major; Armor Potency +1/+2/+3). When there's more than one, the card
// reads like the book / Archives of Nethys: the shared entry (traits, flavor)
// followed by EVERY version stacked, each with its own level, price, and text.
// `variant` is the selected index (or -1/undefined for none). When
// `onVariantChange(index)` is supplied the versions become a keyboard-navigable
// radiogroup and the consumer owns/persists/requires the pick; without it the
// versions render as a read-only reference list (the `variant` index, if valid,
// still highlights the locked choice).
const ItemCard = ({ data, masked, maskLabel, variant = -1, onVariantChange }) => {
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
  const { bulk, price, traits, text } = stat_block
  const allVariants = Array.isArray(stat_block.variants) ? stat_block.variants : []
  // Only treat it as "having variants" when there's a real choice (>1); a lone
  // entry equals the base and renders as a plain item.
  const hasVariants = allVariants.length > 1

  // Header level: with variants, the lowest version level + "+" (the book's rune-
  // family convention, e.g. "Item 5+"); otherwise the item's own level.
  const variantLevels = allVariants
    .map((v) => v.level)
    .filter((l) => l !== undefined && l !== null)
  const baseLevel = hasVariants && variantLevels.length ? Math.min(...variantLevels) : stat_block.level
  const levelText = baseLevel !== undefined && baseLevel !== null
    ? `Item ${baseLevel}${hasVariants ? '+' : ''}`
    : null

  return (
    <div className='Monster'>
      <div className='Monster__header'>
        <div className='Monster__name'>{data.name}</div>
        {levelText ? <div className='Monster__level'>{levelText}</div> : null}
      </div>

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

      {hasVariants ? (
        <VariantList variants={allVariants} selected={variant} onSelect={onVariantChange} />
      ) : null}
    </div>
  )
}

// The stacked version list. Selectable (a keyboard-navigable radiogroup) when
// onSelect is a function; a read-only reference list otherwise. Selected index
// highlights either way (so a saved pick shows in a read-only view).
const VariantList = ({ variants, selected, onSelect }) => {
  const selectable = typeof onSelect === 'function'
  const refs = useRef([])
  // Roving tabindex: the selected row (or the first) is the tab stop.
  const activeIndex = selected >= 0 && selected < variants.length ? selected : 0

  const move = (from, delta) => {
    const to = (from + delta + variants.length) % variants.length
    onSelect(to)
    const el = refs.current[to]
    if (el) { el.focus() }
  }
  const onKeyDown = (e, i) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(i) }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); move(i, 1) }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); move(i, -1) }
  }

  return (
    <div
      className='Monster__variants'
      role={selectable ? 'radiogroup' : 'list'}
      aria-label={selectable ? 'Choose a version' : 'Versions'}
    >
      {variants.map((v, i) => {
        const isSelected = i === selected
        const interactive = selectable
          ? {
              role: 'radio',
              'aria-checked': isSelected,
              tabIndex: i === activeIndex ? 0 : -1,
              ref: (el) => { refs.current[i] = el },
              onClick: () => onSelect(i),
              onKeyDown: (e) => onKeyDown(e, i),
            }
          : { role: 'listitem' }
        return (
          <div
            key={i}
            className={`Monster__variant${isSelected ? ' Monster__variant--selected' : ''}${selectable ? ' Monster__variant--selectable' : ''}`}
            {...interactive}
          >
            {selectable ? <span className='Monster__variant-radio' aria-hidden='true' /> : null}
            <div className='Monster__variant-main'>
              <div className='Monster__variant-header'>
                <span className='Monster__variant-name'>{v.name}</span>
                {v.level !== undefined && v.level !== null ? (
                  <span className='Monster__variant-level'>Item {v.level}</span>
                ) : null}
              </div>
              {v.price && v.price.text ? (
                <div className='Monster__variant-price'>
                  <strong className='Monster__heading'>Price </strong>{v.price.text}
                </div>
              ) : null}
              {v.text ? (
                <div className='Monster__variant-text'><Markdown text={v.text} /></div>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}

VariantList.propTypes = {
  variants: PropTypes.array.isRequired,
  selected: PropTypes.number,
  onSelect: PropTypes.func // (index) => void; when present, versions are selectable
}

ItemCard.propTypes = {
  data: PropTypes.object.isRequired,
  masked: PropTypes.bool,
  maskLabel: PropTypes.string,
  variant: PropTypes.number, // selected index into stat_block.variants (-1 = none)
  onVariantChange: PropTypes.func // (index) => void; makes the versions selectable
}

export default ItemCard
