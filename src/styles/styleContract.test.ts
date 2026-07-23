import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const componentsCss = readFileSync('src/styles/components.css', 'utf8')
const globalCss = readFileSync('src/styles/global.css', 'utf8')
const tokensCss = readFileSync('src/styles/tokens.css', 'utf8')

function declarations(css: string, selector: string) {
  const selectorIndex = css.indexOf(selector)
  const declarationStart = css.indexOf('{', selectorIndex)
  const declarationEnd = css.indexOf('}', declarationStart)

  expect(selectorIndex, `Missing CSS rule: ${selector}`).toBeGreaterThanOrEqual(
    0,
  )
  return css.slice(declarationStart + 1, declarationEnd)
}

function token(name: string) {
  const match = tokensCss.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  expect(match, `Missing color token: ${name}`).not.toBeNull()
  return match?.[1] ?? '#000000'
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4,
    )

  return (
    0.2126 * channels[0]! +
    0.7152 * channels[1]! +
    0.0722 * channels[2]!
  )
}

function contrast(left: string, right: string) {
  const [lighter, darker] = [
    relativeLuminance(left),
    relativeLuminance(right),
  ].sort((a, b) => b - a)

  return (lighter! + 0.05) / (darker! + 0.05)
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

  it('gives form control boundaries at least 3:1 contrast against raised paper', () => {
    expect(contrast(token('--control-border'), token('--paper-raised'))).toBeGreaterThanOrEqual(3)

    ;[
      '.obsidian-field input',
      '.roadmap-filter-fields input,',
      '.file-field input {',
      '.file-field input::file-selector-button',
    ].forEach((selector) => {
      expect(declarations(componentsCss, selector)).toContain(
        'solid var(--control-border)',
      )
    })
  })
})
