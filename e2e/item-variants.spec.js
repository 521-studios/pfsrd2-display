import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// A rune stores its variants in stat_block.variants (Striking / Greater / Major,
// each its own level + price). ItemCard renders a variant selector; switching it
// re-renders the header level and the price.
test('switching an item variant updates the level and price', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('striking')
  const striking = page.locator('[data-testid="item-search-result"][data-name="Striking"]').first()
  await expect(striking).toBeVisible()
  await striking.click()

  const card = page.getByTestId('item-detail')
  const select = card.locator('.Monster__variant-select')
  await expect(select).toBeVisible()

  // Base variant (Striking): level 4, 65 gp.
  await expect(card.locator('.Monster__level')).toContainText('4')
  await expect(card.locator('.Monster__price')).toContainText('65 gp')

  // Switch to the Greater variant (option value = variant index 1): level 12.
  await select.selectOption('1')
  await expect(card.locator('.Monster__level')).toContainText('12')
  await expect(card.locator('.Monster__price')).toContainText('1,065 gp')

  // Switch to Major (index 2): level 19, 31,065 gp.
  await select.selectOption('2')
  await expect(card.locator('.Monster__level')).toContainText('19')
  await expect(card.locator('.Monster__price')).toContainText('31,065 gp')

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})
