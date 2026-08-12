import { test, expect } from '@playwright/test'
import { searchAndSelect, trackApiErrors } from './helpers/harness.js'

// Applying a template must (a) re-render the stat block via the templates/apply
// API and (b) highlight what changed — the library's headline feature. We assert
// the .Monster__changed highlight class appears, which only the patches prop
// produces, so this proves the whole apply→merge-patches→highlight chain.
test('applying a template highlights the changed values', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  const statBlock = await searchAndSelect(page, 'goblin', 'Goblin Bat-Dog')
  await expect(statBlock.locator('.Monster__changed')).toHaveCount(0) // nothing changed yet

  // Pick a real template (skip the disabled "+ Add template" placeholder).
  const select = page.getByTestId('template-select')
  await expect(select).toBeEnabled()
  const optionLabels = await select.locator('option:not([disabled])').allTextContents()
  expect(optionLabels.length, 'the creature should have applicable templates').toBeGreaterThan(0)
  // Prefer Elite (universal adjustment) for a stable, always-present choice.
  const choice = optionLabels.find((l) => /elite/i.test(l)) || optionLabels[0]
  await select.selectOption({ label: choice })

  // The applied template highlights at least one modified value.
  await expect(statBlock.locator('.Monster__changed').first()).toBeVisible()
  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})
