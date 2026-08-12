import { test, expect } from '@playwright/test'
import { searchAndSelect, trackApiErrors } from './helpers/harness.js'

// The core consumer flow: search the pfsrd2-data-api, pick a result, and confirm
// the library renders a stat block for it. This is what every consuming app does.
test('search selects a creature and renders its stat block', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const statBlock = await searchAndSelect(page, 'goblin', 'Goblin Bat-Dog')

  // The rendered block is for the creature we picked.
  await expect(statBlock.locator('.Monster__name')).toContainText('Goblin Bat-Dog')
  // A real stat block has the standard sections wired up.
  await expect(statBlock.locator('.Monster__ac')).toBeVisible()

  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})

test('a bare search (no exact pick) still renders the first result', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  const statBlock = await searchAndSelect(page, 'dragon')
  await expect(statBlock.locator('.Monster__name')).not.toBeEmpty()
})
