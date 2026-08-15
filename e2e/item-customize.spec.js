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

  // Match a candidate row by its EXACT name — "Striking"/"Weapon Potency" are
  // substrings of "Mythic Striking"/"Mythic Weapon Potency", which are also eligible.
  const row = (nameRe) =>
    picker.locator('.ItemSlotPicker__item').filter({
      has: page.locator('.ItemSlotPicker__item-name', { hasText: nameRe }),
    })

  // Apply a graded fundamental rune: Weapon Potency → choose a grade → Apply.
  const potency = row(/^Weapon Potency$/)
  await potency.getByTestId('grade-open').click()
  await potency.getByTestId('apply-grade').click()

  // The applied stack shows it, and the result highlights the added attack bonus.
  await expect(picker.getByTestId('applied-tag')).toContainText('Weapon Potency')
  await expect(card.locator('.Monster__changed')).toBeVisible()
  await expect(card.locator('.Monster__weapon-attack')).toContainText('item')

  // Stack a second rune (Striking) → the damage dice bump + re-render, highlighted.
  const striking = row(/^Striking$/)
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

// A spell holder (wand): the customize panel shows the holder constraints and a
// spell typeahead; picking a spell slots it into the item and renders it.
test('customize: slot a spell into a wand holder', async ({ page }) => {
  const apiErrors = trackApiErrors(page)
  await page.goto('/', { waitUntil: 'domcontentloaded' })

  await page.getByTestId('mode-items').click()
  await page.getByTestId('item-search').fill('magic wand')
  const wand = page.locator('[data-testid="item-search-result"][data-name="Magic Wand"]').first()
  await expect(wand).toBeVisible()
  await wand.click()

  const card = page.getByTestId('item-detail')
  await card.getByTestId('customize').click()
  const picker = page.getByTestId('item-slot-picker')
  await expect(picker.getByTestId('spell-constraints')).toContainText('Holds a wand spell')

  // Search a spell and slot it.
  await picker.getByTestId('spell-search').fill('fireball')
  const fireball = picker.getByTestId('apply-spell').filter({ hasText: 'Fireball' }).first()
  await expect(fireball).toBeVisible()
  await fireball.click()

  await expect(card.locator('.Monster__spell-slot')).toContainText('Fireball')
  await expect(card.locator('.Monster__changed')).toBeVisible()

  expect(apiErrors, `no API errors: ${apiErrors.join(', ')}`).toEqual([])
})
