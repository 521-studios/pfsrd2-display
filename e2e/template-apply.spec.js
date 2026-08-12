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
  // The template list loads via a paginated fetch that only STARTS once the
  // creature is selected, so web-first WAIT for a real option to exist before
  // reading — allTextContents() is a one-shot read and would otherwise race the
  // fetch (flaky against a cold Lambda).
  const select = page.getByTestId('template-select')
  const realOptions = select.locator('option:not([disabled])')
  await expect(realOptions.first()).toBeAttached() // gates on the fetch landing
  const optionLabels = await realOptions.allTextContents()
  expect(optionLabels.length, 'the creature should have applicable templates').toBeGreaterThan(0)
  // Prefer Elite (universal adjustment) for a stable, always-present choice.
  const choice = optionLabels.find((l) => /elite/i.test(l)) || optionLabels[0]
  await select.selectOption({ label: choice })

  // The applied template highlights at least one modified value.
  await expect(statBlock.locator('.Monster__changed').first()).toBeVisible()
  expect(apiErrors, 'no pfsrd2 API call should 4xx/5xx').toEqual([])
})
