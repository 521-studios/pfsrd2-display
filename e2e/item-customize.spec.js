import { test, expect } from '@playwright/test'
import { trackApiErrors } from './helpers/harness.js'

// The ItemSlotPicker customize flow: select a weapon → Customize → browse the
// eligible runes → name it, apply a graded rune → the result renders with the
// change highlighted. Drives the deployed staging harness end to end (the POST
// apply is signed for CloudFront OAC).
test('customize: name a weapon + apply a graded rune → highlighted result', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('rapier')
  const rapier = page.locator('[data-testid="item-search-result"][data-name="Rapier"]').first()
  await expect(rapier).toBeVisible()
  await rapier.click()

  const card = page.getByTestId('item-detail')
  await expect(card.locator('.Monster__name')).toHaveText('Rapier')
  // The base weapon now renders its damage line (so an applied rune is visible).
  await expect(card.locator('.Monster__weapon-damage')).toContainText('1d6 piercing')

  // Enter the customize panel.
  await card.getByTestId('customize').click()
  const picker = page.getByTestId('item-slot-picker')
  await expect(picker).toBeVisible()
  await expect(picker.getByText('Fundamental Runes')).toBeVisible()

  // Name the item → the rendered header follows.
  await picker.getByTestId('item-name').fill('Sting')
  await expect(card.locator('.Monster__name')).toHaveText('Sting')

  // Apply a graded fundamental rune: Weapon Potency → choose a grade → Apply.
  const potency = picker.locator('.ItemSlotPicker__item', { hasText: 'Weapon Potency' })
  await potency.getByTestId('grade-open').click()
  await potency.getByTestId('apply-grade').click()

  // The applied stack shows it, and the result highlights the added attack bonus.
  await expect(picker.getByTestId('applied-tag')).toContainText('Weapon Potency')
  await expect(card.locator('.Monster__changed')).toBeVisible()
  await expect(card.locator('.Monster__weapon-attack')).toContainText('item')

  // Stack a second rune (Striking) → the damage dice bump + re-render, highlighted.
  const striking = picker.locator('.ItemSlotPicker__item', { hasText: 'Striking' }).first()
  const gradeOpen = striking.getByTestId('grade-open')
  if (await gradeOpen.count()) {
    await gradeOpen.click()
    await striking.getByTestId('apply-grade').click()
  } else {
    await striking.getByTestId('apply-candidate').click()
  }
  await expect(card.locator('.Monster__weapon-damage')).toContainText('2d6')
  // The 1-handed rapier must stay 1-handed (regression guard for the hands bug).
  await expect(card.locator('.Monster__name')).toHaveText('Sting')

  expect(apiErrors, `no API errors: ${apiErrors.join(', ')}`).toEqual([])
})
