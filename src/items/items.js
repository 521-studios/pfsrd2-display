// Item customization machinery: fetch what can be applied to an item and apply
// runes / materials / spells to it, chaining several modifications onto one item.
// Extracted from the harness so consumers (encounter-builder-web) customize items
// through the library instead of reimplementing the eligibility + apply calls.
//
// Fetch is CONSUMER-owned (like CreatureSearch / templates.js): fetchEligible takes
// a `get`, applyItemEffect takes a `post`. The library never builds auth/OAC headers.

// fetchEligible returns the grouped "what can I apply to this item?" response:
//   { item, runes: { fundamental, property }, materials, spells }
// where spells is the holder's constraints ({ holder, max_rank, excluded_types,
// constraint_text }) or absent when the item isn't a spell holder. `get(path) =>
// Promise<json>` is consumer-supplied.
export async function fetchEligible({ get, itemGameId }) {
  return get(`/entries/${itemGameId}/eligible`)
}

// applyItemEffect chains one modification onto the in-progress `item` — the base
// item for the first apply, the previous result thereafter — and returns the apply
// endpoint's { item, applied, patches }. `grade` is optional (graded runes select a
// level; property runes and materials omit it). `post(path, bodyString) =>
// Promise<Response>` is consumer-supplied (it adds Content-Type + auth/OAC headers).
// On a non-2xx the thrown error carries `.status` and `.body` so the caller can show
// the boundary refusal (409) distinctly from a server fault.
export async function applyItemEffect({ post, itemGameId, item, effectGameId, grade }) {
  const q = grade !== undefined && grade !== null && grade !== '' ? `?grade=${encodeURIComponent(grade)}` : ''
  const res = await post(`/entries/${itemGameId}/apply/${effectGameId}${q}`, JSON.stringify(item))
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    const err = new Error(`Apply failed: ${res.status}`)
    err.status = res.status
    err.body = body
    throw err
  }
  return res.json()
}

// mergeItemPatches flattens each stack entry's patch groups (the `patches` array
// from applyItemEffect) into the single array ItemCard's `patches` prop expects,
// tagging each group with the applied effect's label so stacked changes stay
// attributable in the change-highlight tooltip. Returns null when nothing changed
// (the prop's "no highlighting" sentinel), symmetric with templates' mergePatches.
export function mergeItemPatches(stack) {
  if (!stack || stack.length === 0) return null
  const groups = []
  for (const entry of stack) {
    if (entry && Array.isArray(entry.patches)) {
      groups.push(
        ...entry.patches.map((g) => ({ ...g, template_name: g.template_name || entry.applied })),
      )
    }
  }
  return groups.length > 0 ? groups : null
}

// customizedItem is the item to render: the latest chained result (or the base item
// when nothing is applied yet), with the GM's custom name overlaid when set. A blank
// name falls back to the underlying item's name (never renders an empty header).
export function customizedItem(baseItem, stack, name) {
  const latest = stack && stack.length > 0 ? stack[stack.length - 1].item : baseItem
  if (!latest) return latest
  const trimmed = typeof name === 'string' ? name.trim() : ''
  if (!trimmed) return latest
  return { ...latest, name: trimmed }
}
