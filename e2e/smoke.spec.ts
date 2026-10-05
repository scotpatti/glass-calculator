import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const result = (page: Page) => page.getByTestId('result')
const expression = (page: Page) => page.getByTestId('expression').locator('[aria-hidden]')
const key = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Keypad' }).getByRole('button', { name, exact: true })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('a standard calculation by tapping keys', async ({ page }) => {
  for (const name of ['2', 'add', '3', 'multiply', '4']) await key(page, name).click()
  await expect(expression(page)).toHaveText('2 + 3 × 4')
  await key(page, 'equals').click()
  await expect(result(page)).toHaveText('14')
})

test('a standard calculation from the keyboard', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Phones have no hardware keyboard')
  await page.keyboard.type('0.1+0.2')
  await page.keyboard.press('Enter')
  await expect(result(page)).toHaveText('0.3')
  await page.keyboard.press('Escape')
  await expect(result(page)).toHaveText('0')
})

test('a scientific calculation', async ({ page }) => {
  await page.getByRole('button', { name: 'Scientific' }).click()
  await page.getByRole('button', { name: 'sine', exact: true }).click()
  await key(page, '3').click()
  await key(page, '0').click()
  await key(page, 'equals').click()
  await expect(expression(page)).toHaveText('sin(30)')
  await expect(result(page)).toHaveText('0.5')
})

test('history survives a reload and a result can be reused', async ({ page }) => {
  for (const name of ['6', 'multiply', '7', 'equals', 'all clear']) await key(page, name).click()
  await page.reload()

  await page.getByRole('button', { name: 'History' }).click()
  await expect(page.getByRole('button', { name: 'Close history' })).toBeFocused()
  await page.getByRole('button', { name: 'Use result: 42' }).click()
  await page.getByRole('button', { name: 'Close history' }).click()

  await key(page, 'add').click()
  await key(page, '1').click()
  await key(page, 'equals').click()
  await expect(result(page)).toHaveText('43')
})

test('the theme toggle switches appearance and is remembered', async ({ page }) => {
  const toggle = page.getByRole('button', { name: 'Dark theme' })
  const background = () =>
    page.evaluate(() => getComputedStyle(document.querySelector('.backdrop')!).backgroundImage)

  const before = await background()
  await toggle.click()
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/)
  expect(await background()).not.toBe(before)

  const chosen = await page.locator('html').getAttribute('data-theme')
  await page.reload()
  await expect(page.locator('html')).toHaveAttribute('data-theme', chosen ?? '')
})

test('layout fits the screen and keys are large enough to tap', async ({ page }) => {
  await page.getByRole('button', { name: 'Scientific' }).click()

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBeLessThanOrEqual(0)

  const smallest = await page.evaluate(() =>
    Math.min(
      ...[...document.querySelectorAll('.key, .tool')].flatMap((element) => {
        const box = element.getBoundingClientRect()
        return [box.width, box.height]
      }),
    ),
  )
  expect(smallest).toBeGreaterThanOrEqual(44)
})

test('a long result shrinks to fit the display', async ({ page }) => {
  for (const name of [...'999999999999', 'multiply', ...'999999999', 'equals']) {
    await key(page, name).click()
  }
  const fits = await page.evaluate(() => {
    const value = document.querySelector('[data-testid="result"]')!.getBoundingClientRect()
    const box = document.querySelector('.display__result')!.getBoundingClientRect()
    return value.left >= box.left - 1 && value.right <= box.right + 1
  })
  expect(fits).toBe(true)
})

test('surfaces turn solid when more contrast is requested', async ({ page }) => {
  await page.emulateMedia({ contrast: 'more' })
  const alpha = await page.evaluate(() => {
    const color = getComputedStyle(document.querySelector('.calculator')!).backgroundColor
    const parts = color.match(/[\d.]+/g) ?? []
    return parts.length > 3 ? Number(parts[3]) : 1
  })
  expect(alpha).toBeGreaterThanOrEqual(0.9)
})

test('motion stops when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const animation = await page.evaluate(
    () => getComputedStyle(document.querySelector('.backdrop__blob')!).animationName,
  )
  expect(animation).toBe('none')
})

test('no accessibility violations', async ({ page }) => {
  await page.getByRole('button', { name: 'Scientific' }).click()
  await key(page, '2').click()
  await key(page, 'add').click()
  await key(page, '3').click()
  await key(page, 'equals').click()
  await page.getByRole('button', { name: 'History' }).click()

  const report = await new AxeBuilder({ page }).analyze()
  expect(report.violations.map((violation) => violation.id)).toEqual([])
})
