import { describe, expect, it } from 'vitest'

import { parseSourceMap } from './import-source-map.mjs'

describe('parseSourceMap', () => {
  it('creates traceable records for headings and list items', () => {
    const fixture = [
      '# 2. JavaScript',
      '',
      '## 2.1. Выполнение',
      '- call stack',
      '1. event loop',
    ].join('\n')

    expect(parseSourceMap(fixture).items).toEqual([
      {
        id: 'L0001',
        line: 1,
        kind: 'h1',
        text: '2. JavaScript',
        h1: '2. JavaScript',
        h2: null,
      },
      {
        id: 'L0003',
        line: 3,
        kind: 'h2',
        text: '2.1. Выполнение',
        h1: '2. JavaScript',
        h2: '2.1. Выполнение',
      },
      {
        id: 'L0004',
        line: 4,
        kind: 'unordered',
        text: 'call stack',
        h1: '2. JavaScript',
        h2: '2.1. Выполнение',
      },
      {
        id: 'L0005',
        line: 5,
        kind: 'ordered',
        text: 'event loop',
        h1: '2. JavaScript',
        h2: '2.1. Выполнение',
      },
    ])
  })
})
