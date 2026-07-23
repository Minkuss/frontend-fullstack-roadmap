import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const componentsCss = readFileSync('src/styles/components.css', 'utf8')
const globalCss = readFileSync('src/styles/global.css', 'utf8')

function declarations(css: string, selector: string) {
  const selectorIndex = css.indexOf(selector)
  const declarationStart = css.indexOf('{', selectorIndex)
  const declarationEnd = css.indexOf('}', declarationStart)

  expect(selectorIndex, `Missing CSS rule: ${selector}`).toBeGreaterThanOrEqual(
    0,
  )
  return css.slice(declarationStart + 1, declarationEnd)
}

describe('quiet study color contract', () => {
  it('reserves terracotta for the primary action', () => {
    expect(declarations(componentsCss, '.button--primary')).toContain(
      'background: var(--accent)',
    )

    const secondaryDecorations = [
      [".app-navigation__link[aria-current='page']", '--focus'],
      ['.storage-warning', '--focus'],
      ['.placeholder-page__eyebrow', '--ink-muted'],
      ['.status-pill--active', '--focus'],
      ['.empty-state__action > a', '--focus'],
    ] as const

    for (const [selector, safeToken] of secondaryDecorations) {
      const rule = declarations(componentsCss, selector)
      expect(rule).toContain(`var(${safeToken})`)
      expect(rule).not.toContain('var(--accent')
    }
  })

  it('keeps the visible focus indicator independent from accent color', () => {
    expect(declarations(globalCss, ':focus-visible')).toContain(
      'solid var(--focus)',
    )
  })

  it('keeps the roadmap scannable with restrained rows and expandable modules', () => {
    expect(declarations(componentsCss, '.roadmap-module > summary')).toContain(
      'cursor: pointer',
    )
    expect(declarations(componentsCss, '.roadmap-topic {')).toContain(
      'border-bottom: 0.0625rem solid var(--line)',
    )
    expect(
      declarations(componentsCss, '.roadmap-queue__item--near'),
    ).toContain('border-left: 0.25rem solid var(--focus)')
  })
})
