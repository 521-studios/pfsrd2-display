import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// A rune stores its versions in stat_block.variants (Striking / Greater / Major,
// each its own level + price). ItemCard reads like the book: the shared entry
// then every version stacked. You lock one in by selecting it (mouse or keyboard).
test('an item with versions stacks them and locks one in on select', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('striking')
  const striking = page.locator('[data-testid="item-search-result"][data-name="Striking"]').first()
  await expect(striking).toBeVisible()
  await striking.click()

  const card = page.getByTestId('item-detail')
  // Book-style header: family name + the lowest level with a "+".
  await expect(card.locator('.Monster__level')).toContainText('4+')

  // Every version is stacked in a radiogroup; nothing selected yet (require a pick).
  await expect(card.locator('.Monster__variants[role="radiogroup"]')).toBeVisible()
  await expect(card.locator('.Monster__variant')).toHaveCount(3)
  await expect(card.locator('.Monster__variant--selected')).toHaveCount(0)

  // Each version shows its own level + price inline.
  const greater = card.locator('.Monster__variant', { hasText: 'Striking (Greater)' })
  await expect(greater).toContainText('Item 12')
  await expect(greater).toContainText('1,065 gp')
  const major = card.locator('.Monster__variant', { hasText: 'Striking (Major)' })
  await expect(major).toContainText('Item 19')
  await expect(major).toContainText('31,065 gp')

  // Click Greater → it locks in (exactly one selected).
  await greater.click()
  await expect(greater).toHaveAttribute('aria-checked', 'true')
  await expect(greater).toHaveClass(/Monster__variant--selected/)
  await expect(card.locator('.Monster__variant--selected')).toHaveCount(1)

  // Selecting Major moves the lock.
  await major.click()
  await expect(major).toHaveAttribute('aria-checked', 'true')
  await expect(greater).toHaveAttribute('aria-checked', 'false')

  // Keyboard: arrow-key navigation moves the lock back.
  await major.press('ArrowUp')
  await expect(greater).toHaveAttribute('aria-checked', 'true')
  await expect(card.locator('.Monster__variant--selected')).toHaveCount(1)

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})
