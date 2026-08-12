// Template helpers: the pfsrd2 template-application machinery, extracted from
// the harness so consumers (encounter-builder-web) apply templates through the
// library instead of reimplementing multipart parsing + patch merging.
//
// Fetch is CONSUMER-owned (like CreatureSearch/ItemSearch): listTemplates takes
// a `get`, applyTemplate takes a `post`. The library never builds URLs with auth
// or signs bodies — encounter-builder-web's client already adds X-Access-Token
// and the CloudFront-OAC `x-amz-content-sha256` header; the harness adds its own.

// parseMultipartResponse parses POST /templates/apply's multipart body into its
// two JSON parts. Exported because the selections flow posts to the same endpoint
// and needs to parse the same shape.
export async function parseMultipartResponse(response) {
  const text = await response.text()
  const boundary = text.split('\n')[0].trim()
  const parts = text.split(boundary)
  let patches = null
  let creature = null
  for (const part of parts) {
    if (part.includes('name="patches"')) {
      patches = JSON.parse(part.substring(part.indexOf('{'), part.lastIndexOf('}') + 1))
    } else if (part.includes('name="creature"')) {
      creature = JSON.parse(part.substring(part.indexOf('{'), part.lastIndexOf('}') + 1))
    }
  }
  return { patches, creature }
}

// mergePatches flattens the applied_patches of a template stack into the single
// array CreatureStatBlock's `patches` prop expects, tagging each group with its
// source template's name so stacked changes stay attributable. Returns null when
// nothing changed (the prop's "no highlighting" sentinel).
export function mergePatches(stack) {
  if (!stack || stack.length === 0) return null
  const groups = []
  for (const entry of stack) {
    if (entry.patches && entry.patches.applied_patches) {
      groups.push(
        ...entry.patches.applied_patches.map((g) => ({
          ...g,
          template_name: entry.template.name,
        })),
      )
    }
  }
  return groups.length > 0 ? groups : null
}

// listTemplates paginates the monster_templates applicable to a creature's
// edition (the server-side applicable_to filter handles same-edition entries +
// cross-type equivalents). `get(path) => Promise<json>` is consumer-supplied.
export async function listTemplates({ get, edition, pageSize = 20 }) {
  const editionFilter = edition ? `&applicable_to=${encodeURIComponent(edition)}` : ''
  let offset = 0
  let all = []
  // Bound the loop by the reported total; guard against a missing/!finite total.
  for (;;) {
    const data = await get(`/search?type=monster_templates&limit=${pageSize}&offset=${offset}${editionFilter}`)
    const results = (data && data.results) || []
    all = all.concat(results)
    const total = data && Number.isFinite(data.total) ? data.total : all.length
    if (results.length < pageSize || all.length >= total) break
    offset += pageSize
  }
  return all.sort((a, b) => a.name.localeCompare(b.name))
}

// applyTemplate applies one template to a creature and returns the resolved
// { patches, creature }. `post(bodyString) => Promise<Response>` is consumer-
// supplied (it adds Content-Type + any auth/OAC headers). `selections` is
// optional — omitted for elite/weak and no-selection templates.
export async function applyTemplate({ post, creature, templateGameId, selections }) {
  const body =
    selections && selections.length > 0
      ? JSON.stringify({ creature, template_game_id: templateGameId, selections })
      : JSON.stringify({ creature, template_game_id: templateGameId })
  const res = await post(body)
  if (!res.ok) throw new Error(`Template apply failed: ${res.status}`)
  return parseMultipartResponse(res)
}
