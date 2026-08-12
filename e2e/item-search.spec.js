import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// The item flow the harness previously lacked entirely: toggle to Items, search
// via the library's ItemSearch, pick a result, and confirm the library's ItemCard
// renders it. This is what encounter-builder-web's treasure list will do.
test('item search selects an item and renders its ItemCard', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // Switch to the item search mode.
  await page.getByTestId('mode-items').click()
  const search = page.getByTestId('item-search')
  await expect(search).toBeVisible()
  await search.fill('sword')

  // Pick a specific result and confirm ItemCard renders it.
  const results = page.getByTestId('item-search-result')
  await expect(results.first()).toBeVisible()
  const swordCane = page.locator('[data-testid="item-search-result"][data-name="Sword Cane"]').first()
  await expect(swordCane, 'Sword Cane should be in the item results').toBeVisible()
  await swordCane.click()

  const detail = page.getByTestId('item-detail')
  await expect(detail.locator('.Monster__name')).toContainText('Sword Cane')

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})

test('a bare item search renders the first result', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('shield')
  const results = page.getByTestId('item-search-result')
  await expect(results.first()).toBeVisible()
  await results.first().click()
  await expect(page.getByTestId('item-detail').locator('.Monster__name')).not.toBeEmpty()
})
