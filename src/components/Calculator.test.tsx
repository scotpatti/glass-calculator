import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../App'
import { STORAGE_KEY } from '../state/storage'

const result = () => screen.getByTestId('result')
const expression = () => screen.getByTestId('expression').querySelector('[aria-hidden]')
const key = (name: string) =>
  within(screen.getByRole('group', { name: 'Keypad' })).getByRole('button', { name })

function setup() {
  const user = userEvent.setup()
  const view = render(<App />)
  return { user, ...view }
}

beforeEach(() => {
  localStorage.clear()
  delete document.documentElement.dataset.theme
})

describe('structure (E3-S1, E3-S3, E6-S1)', () => {
  it('puts the calculator in the main landmark under a page heading', () => {
    setup()
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: 'Glass Calculator' })).toBeVisible()
    expect(within(main).getByRole('group', { name: 'Display' })).toBeInTheDocument()
  })

  it('lays out the standard keypad in the conventional order with spoken names', () => {
    setup()
    const names = within(screen.getByRole('group', { name: 'Keypad' }))
      .getAllByRole('button')
      .map((button) => button.getAttribute('aria-label'))
    expect(names).toEqual([
      ...['all clear', 'backspace', 'percent', 'divide'],
      ...['7', '8', '9', 'multiply'],
      ...['4', '5', '6', 'subtract'],
      ...['1', '2', '3', 'add'],
      ...['toggle sign', '0', 'decimal point', 'equals'],
    ])
  })

  it('shows 0 before anything is entered', () => {
    setup()
    expect(result()).toHaveTextContent('0')
    expect(expression()).toHaveTextContent('')
  })
})

describe('pointer input (E5-S1)', () => {
  it('builds and evaluates an expression', async () => {
    const { user } = setup()
    for (const name of ['7', 'add', '8', 'multiply', '2']) await user.click(key(name))
    expect(expression()).toHaveTextContent('7 + 8 × 2')

    await user.click(key('equals'))
    expect(result()).toHaveTextContent('23')
    expect(result()).toHaveAttribute('data-kind', 'result')
    expect(expression()).toHaveTextContent('7 + 8 × 2')
  })

  it('registers every press once, in order', async () => {
    const { user } = setup()
    for (const name of ['1', '2', '3', '4', '5']) await user.click(key(name))
    expect(expression()).toHaveTextContent('12345')
  })
})

describe('keyboard input (E5-S2, E5-S6)', () => {
  it('accepts digits, operators, Enter, Backspace and Escape', async () => {
    const { user } = setup()
    await user.keyboard('12.5+3*4/2-1')
    expect(expression()).toHaveTextContent('12.5 + 3 × 4 ÷ 2 − 1')

    await user.keyboard('{Enter}')
    expect(result()).toHaveTextContent('17.5')

    await user.keyboard('9{Backspace}8=')
    expect(result()).toHaveTextContent('8')

    await user.keyboard('{Escape}')
    expect(result()).toHaveTextContent('0')
    expect(expression()).toHaveTextContent('')
  })

  it('lights the matching on-screen key', async () => {
    const { user } = setup()
    await user.keyboard('5')
    expect(key('5')).toHaveAttribute('data-pressed', 'true')
    expect(key('6')).toHaveAttribute('data-pressed', 'false')
  })

  it('leaves browser shortcuts and unused keys alone', async () => {
    const { user } = setup()
    await user.keyboard('{Control>}5{/Control}{Meta>}1{/Meta}xq')
    expect(expression()).toHaveTextContent('')
  })

  it('lets Enter and Space activate a focused key instead of evaluating', async () => {
    const { user } = setup()
    await user.keyboard('2+')
    key('3').focus()
    await user.keyboard('{Enter}')
    expect(expression()).toHaveTextContent('2 + 3')
    expect(result()).toHaveAttribute('data-kind', 'preview')

    await user.keyboard(' ')
    expect(expression()).toHaveTextContent('2 + 33')
  })

  it('still evaluates on Enter after a toolbar button was clicked with the pointer', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Scientific' }))
    await user.keyboard('2+3{Enter}')
    expect(result()).toHaveAttribute('data-kind', 'result')
    expect(screen.getByRole('button', { name: 'Scientific' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('does not move focus to a key on a pointer press', async () => {
    const { user } = setup()
    await user.click(key('7'))
    expect(key('7')).not.toHaveFocus()
    await user.keyboard('{Enter}')
    expect(result()).toHaveAttribute('data-kind', 'result')
  })
})

describe('display (E3-S2)', () => {
  it('previews the value while typing and finalises it on equals', async () => {
    const { user } = setup()
    await user.keyboard('2+3')
    expect(result()).toHaveTextContent('5')
    expect(result()).toHaveAttribute('data-kind', 'preview')

    await user.keyboard('=')
    expect(result()).toHaveAttribute('data-kind', 'result')
  })

  it('groups thousands in results', async () => {
    const { user } = setup()
    await user.keyboard('1234567*2=')
    expect(result()).toHaveTextContent('2,469,134')
  })

  it('shows errors as a short message and keeps the expression editable', async () => {
    const { user } = setup()
    await user.keyboard('5/0=')
    expect(result()).toHaveTextContent("Can't divide by zero")
    expect(result()).toHaveAttribute('data-kind', 'error')

    await user.keyboard('{Backspace}{Backspace}2=')
    expect(result()).toHaveTextContent('2.5')
  })

  it('shows brackets still to be closed', async () => {
    const { user } = setup()
    await user.keyboard('2*(3+(4')
    expect(expression()?.querySelector('.display__ghost')).toHaveTextContent('))')
  })
})

describe('announcements (E6-S2)', () => {
  it('announces the result in words, but not the live preview', async () => {
    const { user } = setup()
    await user.keyboard('2+3')
    expect(screen.getByTestId('announcement')).toBeEmptyDOMElement()

    await user.keyboard('=')
    expect(screen.getByRole('status')).toHaveTextContent('2 plus 3 equals 5')
    expect(screen.getByRole('alert')).toBeEmptyDOMElement()
  })

  it('announces errors assertively', async () => {
    const { user } = setup()
    await user.keyboard('5/0=')
    expect(screen.getByRole('alert')).toHaveTextContent("Can't divide by zero")
  })
})

describe('scientific mode (E8-S1, E8-S4)', () => {
  it('toggles the extended keypad, keeps the expression and remembers the choice', async () => {
    const { user, unmount } = setup()
    expect(screen.queryByRole('group', { name: 'Scientific functions' })).not.toBeInTheDocument()

    await user.keyboard('2+3')
    const toggle = screen.getByRole('button', { name: 'Scientific' })
    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('group', { name: 'Scientific functions' })).toBeInTheDocument()
    expect(expression()).toHaveTextContent('2 + 3')

    unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Scientific' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('evaluates with function keys and switches angle unit', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'Scientific' }))
    await user.click(screen.getByRole('button', { name: 'sine' }))
    await user.keyboard('30=')
    expect(expression()).toHaveTextContent('sin(30)')
    expect(result()).toHaveTextContent('0.5')

    await user.click(screen.getByRole('button', { name: /Angle unit: degrees/ }))
    expect(screen.getByRole('button', { name: /Angle unit: radians/ })).toHaveTextContent('RAD')

    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'sine' }))
    await user.click(screen.getByRole('button', { name: 'pi' }))
    await user.keyboard('/2=')
    expect(result()).toHaveTextContent('1')
  })

  it('accepts scientific operators from the keyboard in standard mode', async () => {
    const { user } = setup()
    await user.keyboard('(2+3)^2=')
    expect(result()).toHaveTextContent('25')
  })
})

describe('history (E7-S1 to E7-S4, E6-S3)', () => {
  async function withHistory() {
    const utils = setup()
    await utils.user.keyboard('2*3={Escape}10-3={Escape}')
    await utils.user.click(screen.getByRole('button', { name: 'History' }))
    return utils
  }

  it('shows an empty state', async () => {
    const { user } = setup()
    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByText('No calculations yet.')).toBeInTheDocument()
  })

  it('lists calculations newest first and moves focus into the panel', async () => {
    await withHistory()
    const panel = screen.getByRole('region', { name: 'History' })
    const entries = within(panel).getAllByRole('listitem')
    expect(entries).toHaveLength(2)
    expect(entries[0]).toHaveTextContent('10 − 3')
    expect(entries[0]).toHaveTextContent('= 7')
    expect(screen.getByRole('button', { name: 'Close history' })).toHaveFocus()
  })

  it('inserts a result into the current expression', async () => {
    const { user } = await withHistory()
    await user.keyboard('5+')
    await user.click(screen.getByRole('button', { name: 'Use result: 6' }))
    expect(expression()).toHaveTextContent('5 + 6')
  })

  it('reloads an expression for editing', async () => {
    const { user } = await withHistory()
    await user.click(screen.getByRole('button', { name: 'Edit expression: 2 times 3' }))
    expect(expression()).toHaveTextContent('2 × 3')
    expect(result()).toHaveAttribute('data-kind', 'preview')
  })

  it('removes a single entry', async () => {
    const { user } = await withHistory()
    await user.click(screen.getByRole('button', { name: 'Remove from history: 10 minus 3' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(1)
  })

  it('clears everything only after confirmation', async () => {
    const { user } = await withHistory()
    await user.click(screen.getByRole('button', { name: 'Clear history' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.getAllByRole('listitem')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Clear history' }))
    await user.click(screen.getByRole('button', { name: 'Clear' }))
    expect(screen.getByText('No calculations yet.')).toBeInTheDocument()
  })

  it('closes on Escape and returns focus to the History button', async () => {
    const { user } = await withHistory()
    await user.keyboard('7')
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('region', { name: 'History' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'History' })).toHaveFocus()
    expect(expression()).toHaveTextContent('7')
  })
})

describe('memory (E7-S5)', () => {
  it('stores, shows an indicator, recalls and clears', async () => {
    const { user } = setup()
    const display = screen.getByRole('group', { name: 'Display' })
    await user.keyboard('4*5=')
    await user.click(screen.getByRole('button', { name: 'memory add' }))
    expect(within(display).getByText('Memory holds 20')).toBeInTheDocument()

    await user.keyboard('{Escape}1+')
    await user.click(screen.getByRole('button', { name: 'memory recall' }))
    expect(expression()).toHaveTextContent('1 + 20')

    await user.click(screen.getByRole('button', { name: 'memory clear' }))
    expect(within(display).queryByText(/Memory holds/)).not.toBeInTheDocument()
  })
})

describe('persistence (E7-S6)', () => {
  it('restores history and memory after a reload', async () => {
    const { user, unmount } = setup()
    await user.keyboard('6*7=')
    await user.click(screen.getByRole('button', { name: 'memory add' }))
    unmount()

    render(<App />)
    expect(screen.getByText('Memory holds 42')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'History' }))
    expect(screen.getByRole('button', { name: 'Use result: 42' })).toBeInTheDocument()
  })

  it('starts clean when stored data is corrupt', () => {
    localStorage.setItem(STORAGE_KEY, '{"version":1,"history":"nope"')
    setup()
    expect(result()).toHaveTextContent('0')
  })
})

describe('theme (E4-S5)', () => {
  it('overrides the system theme and remembers the choice', async () => {
    const { user, unmount } = setup()
    const toggle = screen.getByRole('button', { name: 'Dark theme' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')

    await user.click(toggle)
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(document.documentElement.dataset.theme).toBe('dark')

    unmount()
    render(<App />)
    expect(screen.getByRole('button', { name: 'Dark theme' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})

describe('accessibility scan (E6-S1, E9-S2)', () => {
  // Color contrast cannot be computed without a real renderer; see contrast.test.ts.
  const options = { rules: { 'color-contrast': { enabled: false } } }

  it('finds no violations in standard mode', async () => {
    const { container } = setup()
    const report = await axe.run(container, options)
    expect(report.violations.map((violation) => violation.id)).toEqual([])
  })

  it('finds no violations with scientific mode, memory and history showing', async () => {
    const { user, container } = setup()
    await user.click(screen.getByRole('button', { name: 'Scientific' }))
    await user.keyboard('2+3=')
    await user.click(screen.getByRole('button', { name: 'memory add' }))
    await user.click(screen.getByRole('button', { name: 'History' }))
    const report = await axe.run(container, options)
    expect(report.violations.map((violation) => violation.id)).toEqual([])
  })
})
