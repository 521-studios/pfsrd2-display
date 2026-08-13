// Numeric accessors over pfsrd2 entry shapes — the values the display components
// render as strings but downstream consumers (treasure summing, encounter
// budgeting) need as numbers. Kept here in the library because reading the
// entry JSON is the library's job; the app supplies the entries.

// PF2e coin exchange: 1 gp = 10 sp = 100 cp; 1 pp = 10 gp = 100 sp = 1000 cp.
// (https://2e.aonprd.com/Rules.aspx?ID=2144)
export const COIN_TO_CP = { cp: 1, sp: 10, gp: 100, pp: 1000 }

// resolveVariant picks a variant by INDEX (number, matching ItemCard's `variant`
// prop) or by NAME (string, matching an encounter TreasureLine.variant). Returns
// undefined for no/out-of-range selector so callers fall back to the base entry.
function resolveVariant(variants, selector) {
  if (typeof selector === 'number') return selector >= 0 && selector < variants.length ? variants[selector] : undefined
  if (typeof selector === 'string' && selector) return variants.find((v) => v && v.name === selector)
  return undefined
}

// itemPrice returns the effective price OBJECT ({ value, currency, text }) for an
// item, honoring a chosen variant (by index or name); the base price when none
// is chosen/found, or null when neither carries one. Keeps `text` so display
// callers still show "Varies" (text "-", value null) — use itemPriceCp when you
// need a summable number.
export function itemPrice(entry, variant) {
  const sb = (entry && entry.stat_block) || entry || {}
  const variants = Array.isArray(sb.variants) ? sb.variants : []
  const chosen = resolveVariant(variants, variant)
  return (chosen && chosen.price) || sb.price || null
}

// priceToCp converts a price object to integer copper, or null when there's no
// FIXED price (missing, or value null/undefined — e.g. "Varies"). Unknown
// currencies fall back to gp (the overwhelmingly common unit).
export function priceToCp(price) {
  if (!price || price.value === null || price.value === undefined) return null
  const mult = COIN_TO_CP[price.currency] ?? COIN_TO_CP.gp
  return Math.round(price.value * mult)
}

// itemPriceCp is the summable copper value of an item's (variant's) price, or
// null when it has no fixed price. For treasure valuation.
export function itemPriceCp(entry, variant) {
  return priceToCp(itemPrice(entry, variant))
}

// coinsToCp normalizes a coin bag { cp, sp, gp, pp } to integer copper.
export function coinsToCp(coins) {
  const c = coins || {}
  return (c.cp || 0) * COIN_TO_CP.cp + (c.sp || 0) * COIN_TO_CP.sp + (c.gp || 0) * COIN_TO_CP.gp + (c.pp || 0) * COIN_TO_CP.pp
}

// formatGp renders a copper amount as a gp string, e.g. 106500 -> "1,065 gp";
// sub-gp values keep up to two decimals (150 cp -> "1.5 gp"). null for null in.
export function formatGp(cp) {
  if (cp === null || cp === undefined) return null
  const gp = cp / COIN_TO_CP.gp
  const s = Number.isInteger(gp)
    ? gp.toLocaleString('en-US')
    : gp.toLocaleString('en-US', { maximumFractionDigits: 2 })
  return `${s} gp`
}

// creatureLevel reads a creature/NPC's numeric level from
// stat_block.creature_type.level (NOT stat_block.level, which is null for
// creatures). null when absent/non-numeric.
export function creatureLevel(entry) {
  const sb = (entry && entry.stat_block) || entry || {}
  const lvl = sb.creature_type && sb.creature_type.level
  return typeof lvl === 'number' ? lvl : null
}
