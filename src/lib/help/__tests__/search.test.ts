import { describe, expect, it } from 'bun:test'
import {
  buildSearchIndex,
  createSearchInstance,
  searchHelp,
} from '../search'

describe('buildSearchIndex', () => {
  it('returns flat array of searchable items', () => {
    const index = buildSearchIndex()
    expect(index.length).toBe(6)
  })

  it('includes section name in each item', () => {
    const index = buildSearchIndex()
    index.forEach((item) => {
      expect(item.section).toBeDefined()
      expect(typeof item.section).toBe('string')
    })
  })

  it('preserves original item properties', () => {
    const index = buildSearchIndex()
    index.forEach((item) => {
      expect(item.title).toBeDefined()
      expect(item.href).toBeDefined()
      expect(item.description).toBeDefined()
    })
  })
})

describe('createSearchInstance', () => {
  it('returns a Fuse instance', () => {
    const fuse = createSearchInstance()
    expect(fuse).toBeDefined()
    expect(typeof fuse.search).toBe('function')
  })

  it('can perform searches', () => {
    const fuse = createSearchInstance()
    const results = fuse.search('getting started')
    expect(results.length).toBeGreaterThan(0)
  })
})

describe('searchHelp', () => {
  it('returns empty array for empty query', () => {
    const results = searchHelp('')
    expect(results).toEqual([])
  })

  it('returns empty array for whitespace-only query', () => {
    const results = searchHelp('   ')
    expect(results).toEqual([])
  })

  it('finds pages by title', () => {
    const results = searchHelp('getting started')
    expect(results.length).toBeGreaterThan(0)
    expect(results[0].title).toContain('Introduction')
  })

  it('finds pages by description keywords', () => {
    const results = searchHelp('credits')
    expect(results.length).toBeGreaterThan(0)
    const hasCreditsPage = results.some(
      (r) => r.href.includes('credits') || r.description.toLowerCase().includes('credit')
    )
    expect(hasCreditsPage).toBe(true)
  })

  it('limits results to specified count', () => {
    const results = searchHelp('a', 2)
    expect(results.length).toBeLessThanOrEqual(2)
  })

  it('defaults to 5 results maximum', () => {
    const results = searchHelp('a')
    expect(results.length).toBeLessThanOrEqual(5)
  })

  it('returns items with all required properties', () => {
    const results = searchHelp('batch')
    results.forEach((item) => {
      expect(item.title).toBeDefined()
      expect(item.href).toBeDefined()
      expect(item.description).toBeDefined()
      expect(item.section).toBeDefined()
    })
  })
})
