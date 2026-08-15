import React, { useEffect, useId, useMemo, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import Traits from '../creatures/components/Traits'
import Markdown from '../shared/Markdown'
import Changed from '../shared/Changed'
import { DisplayProvider } from '../context/DisplayContext'
import { buildChangedPaths } from '../shared/patches'
import { itemPrice } from '../shared/pf2e'

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
const ItemCard = ({ data, masked, maskLabel, variant = -1, onVariantChange, patches = null }) => {
  // "Reopen the choice" is a local view toggle; the chosen index still lives with
  // the consumer. Reset it when the item itself changes.
  const [choosing, setChoosing] = useState(false)
  const changeRef = useRef(null)
  const commitFocus = useRef(false) // move focus to the change control after a commit
  const itemKey = data ? data.game_id || data.name : null
  useEffect(() => { setChoosing(false) }, [itemKey])
  // Change-highlighting: derive the changed JSON-Pointer set from the applied
  // patches (from mergeItemPatches) against the resolved item, exactly as
  // CreatureStatBlock does. null patches → no highlighting.
  const changedPaths = useMemo(() => buildChangedPaths(patches, data), [patches, data])
  // After a keyboard commit collapses the list, land focus on the change control
  // instead of dropping to <body>. (No-op for a mouse commit: :focus-visible
  // won't show a ring for programmatic focus after a click.)
  useEffect(() => {
    if (commitFocus.current && changeRef.current) {
      commitFocus.current = false
      changeRef.current.focus()
    }
  })

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
  // Category/subcategory read like traits and matter as much (a GM filters and
  // recognizes items by "Rune / Weapon Property Rune"), so render them as badges
  // alongside the trait badges. Locked variants may carry their own.
  const itemCategory = stat_block.item_category
  const itemSubcategory = stat_block.item_subcategory
  // Offense (weapon strikes) and a spell holder's slotted spell are what runes and
  // spell applies change; render them so the applied modification is visible + can
  // highlight. Absent on non-weapons / non-holders (rendered only when present).
  const weaponModes = Array.isArray(stat_block.offense && stat_block.offense.weapon_modes)
    ? stat_block.offense.weapon_modes
    : []
  const heldSpell = stat_block.spell_slots && stat_block.spell_slots.spell
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
  // Same base-or-chosen-variant price selection, via the shared accessor (index
  // selector). Kept as the price object so we still render its `.text`.
  const shownPrice = itemPrice(data, locked ? variant : -1)

  return (
    <DisplayProvider value={{ changedPaths, monsterName: headerName, onRoll: null }}>
    <div className='Monster'>
      <div className='Monster__header'>
        <div className='Monster__name'>{headerName}</div>
        {headerLevel ? <div className='Monster__level'>{headerLevel}</div> : null}
      </div>

      <hr />
      {/* Block-highlight the traits region when a material grants a trait (the
          trait list is re-ordered, so a per-badge path would be unstable). */}
      <Changed path='/stat_block/traits' block>
        <Traits traits={traits} />
      </Changed>

      {itemCategory || itemSubcategory ? (
        <div className='Monster__categories'>
          {itemCategory ? (
            <span className='Monster__trait Monster__trait--category'>{itemCategory}</span>
          ) : null}
          {itemSubcategory ? (
            <span className='Monster__trait Monster__trait--subcategory'>{itemSubcategory}</span>
          ) : null}
        </div>
      ) : null}

      {weaponModes.length > 0 ? (
        <div className='Monster__offense'>
          {weaponModes.map((mode, i) => (
            <WeaponMode key={i} mode={mode} index={i} />
          ))}
        </div>
      ) : null}

      {heldSpell ? (
        <Changed path='/stat_block/spell_slots/spell' block>
          <div className='Monster__spell-slot'>
            <strong className='Monster__heading'>Spell </strong>
            {heldSpell.name}
            {heldSpell.rank != null ? ` (rank ${heldSpell.rank})` : ''}
          </div>
        </Changed>
      ) : null}

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
        <button ref={changeRef} type='button' className='Monster__variant-change' onClick={() => setChoosing(true)}>
          change version
        </button>
      ) : null}

      {hasVariants && !locked ? (
        <VariantList
          variants={allVariants}
          selected={variant}
          autoFocus={choosing && !!chosen}
          onRove={selectable ? onVariantChange : undefined}
          onCommit={selectable ? (i) => { onVariantChange(i); commitFocus.current = true; setChoosing(false) } : undefined}
        />
      ) : null}
    </div>
    </DisplayProvider>
  )
}

// One weapon strike mode: its attack modifiers (a potency rune's item bonus) and
// damage line (a striking rune's bumped dice + re-rendered formula). Each field is
// wrapped in Changed at its own JSON-Pointer path so an applied rune highlights it.
// Modifiers are mapped by their real array index (not filtered) so the path matches
// the append the engine emitted.
const WeaponMode = ({ mode, index }) => {
  const damage = Array.isArray(mode.damage) ? mode.damage : []
  const modifiers = Array.isArray(mode.modifiers) ? mode.modifiers : []
  return (
    <div className='Monster__weapon-mode'>
      {modifiers.map((m, k) =>
        m && m.subtype === 'attack' ? (
          <Changed key={k} path={`/stat_block/offense/weapon_modes/${index}/modifiers/${k}`}>
            <span className='Monster__weapon-attack'>
              <strong className='Monster__heading'>Attack </strong>
              {signed(m.bonus_value)}
              {m.bonus_type ? ` ${m.bonus_type}` : ''}
            </span>
          </Changed>
        ) : null,
      )}
      {damage.length > 0 ? (
        <div className='Monster__weapon-damage'>
          <strong className='Monster__heading'>Damage </strong>
          {damage.map((d, j) => (
            <React.Fragment key={j}>
              {j > 0 ? ' plus ' : ''}
              <Changed path={`/stat_block/offense/weapon_modes/${index}/damage/${j}/formula`}>
                <span>{d.formula}{d.damage_type ? ` ${d.damage_type}` : ''}</span>
              </Changed>
            </React.Fragment>
          ))}
        </div>
      ) : null}
    </div>
  )
}

const signed = (n) => (typeof n === 'number' && n >= 0 ? `+${n}` : `${n}`)

WeaponMode.propTypes = {
  mode: PropTypes.object.isRequired,
  index: PropTypes.number.isRequired,
}

// The stacked version list, shown while choosing. A keyboard-navigable radiogroup
// when onCommit is a function; a read-only reference list otherwise. The selected
// index highlights either way. Arrow keys ROVE (move the highlight via onRove)
// without leaving the list; Enter/Space/click COMMIT (onCommit) — the consumer
// collapses to the chosen version on commit, so arrows must not commit.
const VariantList = ({ variants, selected, onRove, onCommit, autoFocus }) => {
  const selectable = typeof onCommit === 'function'
  const refs = useRef([])
  const baseId = useId() // stable per-card prefix so a radio's label = just its name
  // Roving tabindex: the selected row (or the first) is the tab stop.
  const activeIndex = selected >= 0 && selected < variants.length ? selected : 0

  // On reopen (via "change version"), land focus on the current pick so keyboard
  // users can arrow immediately. Not on initial mount (would steal focus on load).
  useEffect(() => {
    if (autoFocus && refs.current[activeIndex]) { refs.current[activeIndex].focus() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const move = (from, delta) => {
    const to = (from + delta + variants.length) % variants.length
    onRove(to) // highlight only — stays in the list
    const el = refs.current[to]
    if (el) { el.focus() }
  }
  const onKeyDown = (e, i) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onCommit(i) }
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
              onClick: () => onCommit(i),
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
  onRove: PropTypes.func, // (index) => void; arrow-key highlight, no commit
  onCommit: PropTypes.func, // (index) => void; Enter/Space/click; presence = selectable
  autoFocus: PropTypes.bool // focus the current pick on mount (reopen), not on load
}

ItemCard.propTypes = {
  data: PropTypes.object.isRequired,
  masked: PropTypes.bool,
  maskLabel: PropTypes.string,
  variant: PropTypes.number, // selected index into stat_block.variants (-1 = none)
  onVariantChange: PropTypes.func, // (index) => void; makes the versions selectable
  patches: PropTypes.array // merged apply patch groups (mergeItemPatches) → change-highlighting
}

export default ItemCard
