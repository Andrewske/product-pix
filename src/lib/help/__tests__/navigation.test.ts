import { describe, expect, it } from 'bun:test'
import {
  helpNavigation,
  getAllHelpPages,
  getHelpPageBySlug,
  getAllHelpSlugs,
} from '../navigation'

describe('helpNavigation', () => {
  it('has exactly 4 sections', () => {
    expect(helpNavigation).toHaveLength(4)
  })

  it('has exactly 6 total items', () => {
    const totalItems = helpNavigation.reduce(
      (count, section) => count + section.items.length,
      0
    )
    expect(totalItems).toBe(6)
  })

  it('has unique section titles', () => {
    const titles = helpNavigation.map((section) => section.title)
    const uniqueTitles = new Set(titles)
    expect(uniqueTitles.size).toBe(titles.length)
  })

  it('has unique hrefs across all items', () => {
    const allHrefs = helpNavigation.flatMap((section) =>
      section.items.map((item) => item.href)
    )
    const uniqueHrefs = new Set(allHrefs)
    expect(uniqueHrefs.size).toBe(allHrefs.length)
  })

  it('all hrefs start with /help/', () => {
    const allItems = helpNavigation.flatMap((section) => section.items)
    allItems.forEach((item) => {
      expect(item.href).toMatch(/^\/help\//)
    })
  })
})

describe('getAllHelpPages', () => {
  it('returns flat array of all help pages', () => {
    const pages = getAllHelpPages()
    expect(pages).toHaveLength(6)
  })

  it('each page has title, href, and description', () => {
    const pages = getAllHelpPages()
    pages.forEach((page) => {
      expect(page.title).toBeDefined()
      expect(page.href).toBeDefined()
      expect(page.description).toBeDefined()
      expect(typeof page.title).toBe('string')
      expect(typeof page.href).toBe('string')
      expect(typeof page.description).toBe('string')
    })
  })
})

describe('getHelpPageBySlug', () => {
  it('returns page for valid slug', () => {
    const page = getHelpPageBySlug('getting-started')
    expect(page).toBeDefined()
    expect(page?.title).toBe('Introduction')
    expect(page?.href).toBe('/help/getting-started')
  })

  it('returns undefined for invalid slug', () => {
    const page = getHelpPageBySlug('nonexistent-page')
    expect(page).toBeUndefined()
  })
})

describe('getAllHelpSlugs', () => {
  it('returns array of slug strings', () => {
    const slugs = getAllHelpSlugs()
    expect(slugs).toHaveLength(6)
    slugs.forEach((slug) => {
      expect(typeof slug).toBe('string')
      expect(slug).not.toContain('/help/')
    })
  })

  it('includes expected slugs', () => {
    const slugs = getAllHelpSlugs()
    expect(slugs).toContain('getting-started')
    expect(slugs).toContain('single-image-generation')
    expect(slugs).toContain('batch-processing')
    expect(slugs).toContain('credits-pricing')
    expect(slugs).toContain('account-management')
    expect(slugs).toContain('faq')
  })
})
