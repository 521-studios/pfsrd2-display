import { expect } from '@playwright/test'

// Drive the harness's creature search → suggestions → select flow, then wait for
// the library to render the stat block. Returns once [data-testid="stat-block"]
// is up. `name` picks a specific result (data-name); omit to take the first.
export async function searchAndSelect(page, query, name) {
  const search = page.getByTestId('creature-search')
  await search.waitFor({ timeout: 20_000 }) // wait for React to mount
  await search.fill(query)

  const results = page.getByTestId('search-result')
  await expect(results.first()).toBeVisible()

  let target
  if (name) {
    // Escape quotes so a name with a " can't break the attribute selector.
    const sel = `[data-testid="search-result"][data-name="${name.replace(/"/g, '\\"')}"]`
    target = page.locator(sel).first()
    // Fail fast with a clear message if the creature fell outside the search
    // cap (limit:15) — otherwise the click would hang until the 90s test timeout.
    await expect(target, `result "${name}" should be in the search results`).toBeVisible()
  } else {
    target = results.first()
  }
  await target.click()

  const statBlock = page.getByTestId('stat-block')
  await expect(statBlock).toBeVisible()
  await expect(statBlock.locator('.Monster')).toBeVisible()
  return statBlock
}

// Fail a test if any pfsrd2-data-api call returned 4xx/5xx.
export function trackApiErrors(page) {
  const errors = []
  page.on('response', (r) => {
    if (r.url().includes('/api/pfsrd2/') && r.status() >= 400) {
      errors.push(`${r.status()} ${r.request().method()} ${r.url()}`)
    }
  })
  return errors
}
