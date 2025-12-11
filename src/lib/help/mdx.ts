import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getAllHelpSlugs } from './navigation'

export type HelpContentMeta = {
  title: string
  description: string
  slug: string
}

export type HelpContent = {
  meta: HelpContentMeta
  content: string
}

const CONTENT_DIR = path.join(process.cwd(), 'src/content/help')

/**
 * Get the file path for a help page slug
 */
export const getHelpFilePath = (slug: string): string => {
  return path.join(CONTENT_DIR, `${slug}.mdx`)
}

/**
 * Check if a help page exists
 */
export const helpPageExists = (slug: string): boolean => {
  const filePath = getHelpFilePath(slug)
  return fs.existsSync(filePath)
}

/**
 * Get help content by slug
 * Returns null if the file doesn't exist
 */
export const getHelpContent = (slug: string): HelpContent | null => {
  const filePath = getHelpFilePath(slug)

  if (!fs.existsSync(filePath)) {
    return null
  }

  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)

  return {
    meta: {
      title: data.title ?? slug,
      description: data.description ?? '',
      slug,
    },
    content,
  }
}

/**
 * Get all help page metadata for static generation
 */
export const getAllHelpContent = (): HelpContent[] => {
  const slugs = getAllHelpSlugs()
  return slugs
    .map((slug) => getHelpContent(slug))
    .filter((content): content is HelpContent => content !== null)
}

/**
 * Get static params for all help pages
 */
export const generateHelpStaticParams = (): { slug: string[] }[] => {
  const slugs = getAllHelpSlugs()
  return slugs.map((slug) => ({ slug: [slug] }))
}
