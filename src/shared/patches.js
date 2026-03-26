/**
 * Build a Set of changed JSON Pointer paths from an array of patch groups.
 * Each group has { change_category, description, operations: [{ op, path, value }] }
 *
 * For array appends (path ending in /-), we store both the raw path and a
 * synthetic indexed path based on the final creature data, so individual
 * array items can be highlighted.
 */
export function buildChangedPaths(patchGroups, creature) {
  if (!patchGroups || !Array.isArray(patchGroups)) return null
  const paths = new Set()

  // Track append counts per array path so we can compute indices from the end
  const appendCounts = {}

  for (const group of patchGroups) {
    if (!group.operations) continue
    for (const op of group.operations) {
      if (!op.path) continue

      if (op.path.endsWith('/-')) {
        // Array append — store the array path (without /-) as changed
        const arrayPath = op.path.slice(0, -2)
        paths.add(arrayPath)
        // Count appends to this array
        appendCounts[arrayPath] = (appendCounts[arrayPath] || 0) + 1
      } else {
        paths.add(op.path)
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
        }
      }
    }
  }

  return paths.size > 0 ? paths : null
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
 * Check if a path was changed.
 */
export function isPathChanged(changedPaths, path) {
  if (!changedPaths || !path) return false
  if (changedPaths.has(path)) return true
  for (const cp of changedPaths) {
    if (cp.startsWith(path + '/')) return true
  }
  return false
}

/**
 * Check if an array had items appended.
 */
export function isArrayAppended(changedPaths, arrayPath) {
  if (!changedPaths || !arrayPath) return false
  return changedPaths.has(arrayPath)
}
