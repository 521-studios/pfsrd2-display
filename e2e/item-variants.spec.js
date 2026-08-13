import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// A rune stores its versions in stat_block.variants (Striking / Greater / Major).
// The card reads like the book: the stacked choice, then — once you lock a version
// in — it collapses to just that version, with a "change version" control to reopen.
test('versions: stacked choice → lock in collapses to one → change reopens', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('striking')
  const striking = page.locator('[data-testid="item-search-result"][data-name="Striking"]').first()
  await expect(striking).toBeVisible()
  await striking.click()

  const card = page.getByTestId('item-detail')
  // Choosing: family header ("Item 4+") + all three versions, nothing locked.
  await expect(card.locator('.Monster__level')).toContainText('4+')
  await expect(card.locator('.Monster__variants[role="radiogroup"]')).toBeVisible()
  await expect(card.locator('.Monster__variant')).toHaveCount(3)
  const greater = card.locator('.Monster__variant', { hasText: 'Striking (Greater)' })
  await expect(greater).toContainText('Item 12')

  // Lock in Greater → collapses to just that version (as the item) + a change link.
  await greater.click()
  await expect(card.locator('.Monster__variants')).toHaveCount(0) // the list is gone
  await expect(card.locator('.Monster__name')).toHaveText('Striking (Greater)')
  await expect(card.locator('.Monster__level')).toContainText('Item 12')
  await expect(card.locator('.Monster__variant-change')).toBeVisible()

  // Change version → reopens the full choice, current pick remembered/highlighted.
  await card.locator('.Monster__variant-change').click()
  await expect(card.locator('.Monster__variants[role="radiogroup"]')).toBeVisible()
  await expect(card.locator('.Monster__variant')).toHaveCount(3)
  await expect(
    card.locator('.Monster__variant', { hasText: 'Striking (Greater)' }),
  ).toHaveAttribute('aria-checked', 'true')

  // Pick Major → collapses to Major.
  await card.locator('.Monster__variant', { hasText: 'Striking (Major)' }).click()
  await expect(card.locator('.Monster__name')).toHaveText('Striking (Major)')
  await expect(card.locator('.Monster__level')).toContainText('Item 19')
  await expect(card.locator('.Monster__variants')).toHaveCount(0)

  // Keyboard: reopen (focus lands on the current pick), arrow ROVES without
  // collapsing, Enter commits.
  await card.locator('.Monster__variant-change').click()
  const list = card.locator('.Monster__variants[role="radiogroup"]')
  await expect(list).toBeVisible()
  await page.keyboard.press('ArrowUp') // Major → Greater, list stays open
  await expect(list).toBeVisible()
  await expect(
    card.locator('.Monster__variant', { hasText: 'Striking (Greater)' }),
  ).toHaveAttribute('aria-checked', 'true')
  await page.keyboard.press('Enter') // commit → collapse
  await expect(card.locator('.Monster__variants')).toHaveCount(0)
  await expect(card.locator('.Monster__name')).toHaveText('Striking (Greater)')

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})
