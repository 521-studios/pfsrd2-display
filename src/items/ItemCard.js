import React, { useEffect, useId, useRef, useState } from 'react'
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
// Some items carry `stat_block.variants` (a rune's Striking / Greater / Major,
// Armor Potency +1/+2/+3). The card reads like the book / Archives of Nethys:
//   - No version chosen (`variant < 0`): the family entry + EVERY version
//     stacked, each its own level/price/text. Selectable (a keyboard radiogroup)
//     when `onVariantChange` is supplied, else a read-only reference list.
//   - A version chosen (`variant >= 0`): the card collapses to JUST that version,
//     rendered as the item — with a "change version" control (when selectable)
//     to reopen the full choice.
// `variant` is the selected index (or -1/undefined for none); `onVariantChange(index)`
// persists the pick (the consumer owns/requires it).
const ItemCard = ({ data, masked, maskLabel, variant = -1, onVariantChange }) => {
  // "Reopen the choice" is a local view toggle; the chosen index still lives with
  // the consumer. Reset it when the item itself changes.
  const [choosing, setChoosing] = useState(false)
  const itemKey = data ? data.game_id || data.name : null
  useEffect(() => { setChoosing(false) }, [itemKey])

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
  // Only a real choice (>1) counts; a lone entry equals the base and renders plainly.
  const hasVariants = allVariants.length > 1
  const selectable = hasVariants && typeof onVariantChange === 'function'

  const chosen = hasVariants && variant >= 0 && variant < allVariants.length ? allVariants[variant] : null
  // Locked: a version is chosen and we're not actively re-choosing → render just it.
  const locked = !!chosen && !choosing

  // Header: locked → the chosen version (its own level); otherwise the family name
  // and the lowest version level with a "+" (the book's rune-family convention).
  const variantLevels = allVariants.map((v) => v.level).filter((l) => l !== undefined && l !== null)
  const familyLevel = hasVariants && variantLevels.length ? Math.min(...variantLevels) : stat_block.level
  const headerName = locked ? chosen.name : data.name
  const headerLevel = locked
    ? (chosen.level !== undefined && chosen.level !== null ? `Item ${chosen.level}` : null)
    : (familyLevel !== undefined && familyLevel !== null ? `Item ${familyLevel}${hasVariants ? '+' : ''}` : null)
  const shownPrice = locked ? (chosen.price || price) : price

  return (
    <div className='Monster'>
      <div className='Monster__header'>
        <div className='Monster__name'>{headerName}</div>
        {headerLevel ? <div className='Monster__level'>{headerLevel}</div> : null}
      </div>

      <hr />
      <Traits traits={traits} />

      {shownPrice && shownPrice.text ? (
        <div className='Monster__price'>
          <strong className="Monster__heading">Price </strong>
          {shownPrice.text}
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

      {/* the chosen version's own rules text, when it has any */}
      {locked && chosen.text ? (
        <div className='Monster__section-text'>
          <Markdown text={chosen.text} />
        </div>
      ) : null}

      {locked && selectable ? (
        <button type='button' className='Monster__variant-change' onClick={() => setChoosing(true)}>
          change version
        </button>
      ) : null}

      {hasVariants && !locked ? (
        <VariantList
          variants={allVariants}
          selected={variant}
          onSelect={selectable ? (i) => { onVariantChange(i); setChoosing(false) } : undefined}
        />
      ) : null}
    </div>
  )
}

// The stacked version list, shown while choosing. A keyboard-navigable radiogroup
// when onSelect is a function; a read-only reference list otherwise. The selected
// index highlights either way.
const VariantList = ({ variants, selected, onSelect }) => {
  const selectable = typeof onSelect === 'function'
  const refs = useRef([])
  const baseId = useId() // stable per-card prefix so a radio's label = just its name
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
      aria-required={selectable ? true : undefined}
    >
      {variants.map((v, i) => {
        const isSelected = i === selected
        const interactive = selectable
          ? {
              role: 'radio',
              'aria-checked': isSelected,
              'aria-labelledby': `${baseId}-v${i}`, // announce just the version name
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
                <span className='Monster__variant-name' id={`${baseId}-v${i}`}>{v.name}</span>
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
