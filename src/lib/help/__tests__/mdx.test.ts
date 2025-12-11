import { describe, expect, it } from 'bun:test'
import {
  getHelpFilePath,
  helpPageExists,
  getHelpContent,
  generateHelpStaticParams,
} from '../mdx'

describe('getHelpFilePath', () => {
  it('returns correct path for slug', () => {
    const path = getHelpFilePath('getting-started')
    expect(path).toContain('src/content/help/getting-started.mdx')
  })
})

describe('helpPageExists', () => {
  it('returns true for existing page', () => {
    expect(helpPageExists('getting-started')).toBe(true)
  })

  it('returns false for non-existing page', () => {
    expect(helpPageExists('nonexistent-page')).toBe(false)
  })
})

describe('getHelpContent', () => {
  it('returns content for existing page', () => {
    const content = getHelpContent('getting-started')
    expect(content).not.toBeNull()
    expect(content?.meta.slug).toBe('getting-started')
    expect(content?.meta.title).toBeDefined()
    expect(content?.content).toBeDefined()
  })

  it('returns null for non-existing page', () => {
    const content = getHelpContent('nonexistent-page')
    expect(content).toBeNull()
  })

  it('parses frontmatter correctly', () => {
    const content = getHelpContent('getting-started')
    expect(content?.meta.title).toBe('Getting Started with ProductPix')
    expect(content?.meta.description).toContain('Learn the basics')
  })
})

describe('generateHelpStaticParams', () => {
  it('returns array of slug params', () => {
    const params = generateHelpStaticParams()
    expect(params.length).toBe(6)
    params.forEach((param) => {
      expect(param.slug).toBeDefined()
      expect(Array.isArray(param.slug)).toBe(true)
    })
  })

  it('includes getting-started slug', () => {
    const params = generateHelpStaticParams()
    const hasGettingStarted = params.some(
      (param) => param.slug[0] === 'getting-started'
    )
    expect(hasGettingStarted).toBe(true)
  })
})
