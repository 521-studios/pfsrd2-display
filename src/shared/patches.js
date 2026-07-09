/**
 * Build a Set of changed JSON Pointer paths from an array of patch groups.
 * Each group has { change_category, description, operations: [{ op, path, value }] }
 *
 * For array appends (path ending in /-), we compute specific indexed paths
 * for the newly added items based on the final creature data. This ensures
 * only new items highlight, not existing ones.
 *
 * For whole-array set operations (no /-), we store the array path itself,
 * which causes all children to highlight (since the entire array is new).
 */
export function buildChangedPaths(patchGroups, creature) {
  if (!patchGroups || !Array.isArray(patchGroups)) return null
  const paths = new Set()
  // path -> Set of template names that touched it (stacked templates must
  // each be named in the hover tooltip)
  const sources = new Map()

  const attribute = (path, name) => {
    if (!name) return
    if (!sources.has(path)) sources.set(path, new Set())
    sources.get(path).add(name)
  }

  // Track append counts per array path so we can compute indices from the end
  const appendCounts = {}
  const appendSources = {}

  for (const group of patchGroups) {
    if (!group.operations) continue
    for (const op of group.operations) {
      if (!op.path) continue

      if (op.path.endsWith('/-')) {
        // Array append — DON'T store the bare array path (that would highlight
        // all existing items). Instead, count appends and compute indexed paths below.
        const arrayPath = op.path.slice(0, -2)
        appendCounts[arrayPath] = (appendCounts[arrayPath] || 0) + 1
        if (group.template_name) {
          appendSources[arrayPath] = appendSources[arrayPath] || new Set()
          appendSources[arrayPath].add(group.template_name)
        }
      } else {
        paths.add(op.path)
        attribute(op.path, group.template_name)
      }
    }
  }

  // For each array that had appends, compute the indices of new items
  // by looking at the final creature data array lengths
  if (creature) {
    for (const [arrayPath, count] of Object.entries(appendCounts)) {
      const array = resolvePath(creature, arrayPath)
      if (Array.isArray(array)) {
        const startIdx = array.length - count
        for (let idx = startIdx; idx < array.length; idx++) {
          paths.add(`${arrayPath}/${idx}`)
          for (const name of appendSources[arrayPath] || []) {
            attribute(`${arrayPath}/${idx}`, name)
          }
        }
      }
    }
  }

  if (paths.size === 0) return null
  paths.sources = sources
  return paths
}

/**
 * Template names that modified a path (exact or prefix match), for tooltip
 * attribution. Returns [] when unattributed.
 */
export function changeSources(changedPaths, path) {
  const sources = changedPaths && changedPaths.sources
  if (!sources || !path) return []
  const names = new Set()
  for (const [cp, set] of sources) {
    if (cp === path || cp.startsWith(path + '/') || path.startsWith(cp + '/')) {
      for (const n of set) names.add(n)
    }
  }
  return [...names]
}

/**
 * Resolve a JSON Pointer path against an object.
 * e.g. resolvePath(obj, "/stat_block/statistics/languages/languages") → array
 */
function resolvePath(obj, pointer) {
  const parts = pointer.split('/').filter(Boolean)
  let current = obj
  for (const part of parts) {
    if (current == null) return undefined
    current = current[part]
  }
  return current
}

/**
 * Check if a path was ADDED by a template (the entry itself is new):
 * exact membership (appended indices, whole-value adds) or a strict
 * ancestor that was added wholesale (a brand-new array highlights all its
 * children). Descendant changes deliberately do NOT count — a modified
 * field inside an existing entry must not mark the whole entry as added.
 */
export function isPathAdded(changedPaths, path) {
  if (!changedPaths || !path) return false
  if (changedPaths.has(path)) return true
  for (const cp of changedPaths) {
    if (path.startsWith(cp + '/')) return true
  }
  return false
}

/**
 * Check if a path was changed.
 * - Exact match
 * - Child of path is changed (e.g. /ac/value changed → /ac is changed)
 * - Path is child of a changed path (e.g. /immunities set → /immunities/3 is changed)
 *   This only applies for whole-array set operations, not appends — appends use indexed paths.
 */
export function isPathChanged(changedPaths, path) {
  if (!changedPaths || !path) return false
  if (changedPaths.has(path)) return true
  for (const cp of changedPaths) {
    if (cp.startsWith(path + '/')) return true
    if (path.startsWith(cp + '/')) return true
  }
  return false
}

