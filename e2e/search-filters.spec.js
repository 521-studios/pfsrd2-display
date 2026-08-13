import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// Filtering the library type-aheads: creature search by trait, item search by
// trait + category + subcategory. The filter vocabularies come from the API
// (/search/traits co-occurrence typeahead, /search/facets), which the harness
// wires exactly as a consuming app would.

test('creature search filters results by a trait chip', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  // Baseline: the exact query surfaces the (non-undead) Adult Cinder Dragon.
  await page.getByTestId('creature-search').fill('adult cinder dragon')
  await expect(
    page.locator('[data-testid="search-result"][data-name="Adult Cinder Dragon"]'),
  ).toBeVisible()

  // Add the Undead trait via the co-occurrence typeahead (options come from
  // /search/traits), then confirm it became a chip.
  await page.getByTestId('CreatureSearch-trait-input').fill('undead')
  const opt = page
    .locator('[data-testid="CreatureSearch-trait-option"]', { hasText: /^Undead$/ })
    .first()
  await expect(opt).toBeVisible()
  await opt.click()
  await expect(page.getByTestId('CreatureSearch-chip')).toHaveText(/Undead/)

  // Adult Cinder Dragon is not Undead → it drops out of the filtered results.
  await expect(
    page.locator('[data-testid="search-result"][data-name="Adult Cinder Dragon"]'),
  ).toHaveCount(0)

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})

test('item search filters by category then subcategory', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('mode-items').click()
  await expect(page.getByTestId('item-search')).toBeVisible()

  const category = page.getByTestId('ItemSearch-category')
  // Category options are populated from /search/facets.
  await expect(category.locator('option', { hasText: 'Runes' })).toBeAttached()

  // Filtered to Armor, the Striking rune is excluded from a "striking" search.
  await category.selectOption('Armor')
  await page.getByTestId('item-search').fill('striking')
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]'),
  ).toHaveCount(0)

  // Switch to Runes → Striking appears.
  await category.selectOption('Runes')
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]').first(),
  ).toBeVisible()

  // Its own subcategory keeps it; a sibling subcategory excludes it.
  const sub = page.getByTestId('ItemSearch-subcategory')
  await sub.selectOption('Fundamental Weapon Runes')
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]').first(),
  ).toBeVisible()
  await sub.selectOption('Weapon Property Runes') // Striking is Fundamental, not Property
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]'),
  ).toHaveCount(0)

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})

test('item search filters by a trait chip', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('striking')
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]').first(),
  ).toBeVisible()

  // The Striking rune is Evocation/Magical, not Acid → an Acid chip excludes it.
  await page.getByTestId('ItemSearch-trait-input').fill('acid')
  const opt = page
    .locator('[data-testid="ItemSearch-trait-option"]', { hasText: /^Acid$/ })
    .first()
  await expect(opt).toBeVisible()
  await opt.click()
  await expect(
    page.locator('[data-testid="item-search-result"][data-name="Striking"]'),
  ).toHaveCount(0)
})
