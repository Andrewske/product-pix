import Fuse, { type IFuseOptions } from 'fuse.js'
import { helpNavigation, type HelpNavItem } from './navigation'

export type SearchableHelpItem = HelpNavItem & {
  section: string
}

/**
 * Build a flat array of searchable help items with section info
 */
export const buildSearchIndex = (): SearchableHelpItem[] => {
  return helpNavigation.flatMap((section) =>
    section.items.map((item) => ({
      ...item,
      section: section.title,
    }))
  )
}

/**
 * Fuse.js configuration for help search
 */
const fuseOptions: IFuseOptions<SearchableHelpItem> = {
  keys: [
    { name: 'title', weight: 0.4 },
    { name: 'description', weight: 0.3 },
    { name: 'section', weight: 0.2 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
}

/**
 * Create a Fuse search instance
 */
export const createSearchInstance = (): Fuse<SearchableHelpItem> => {
  const searchIndex = buildSearchIndex()
  return new Fuse(searchIndex, fuseOptions)
}

/**
 * Search help pages
 * Returns top N results (default 5)
 */
export const searchHelp = (
  query: string,
  limit = 5
): SearchableHelpItem[] => {
  if (!query.trim()) {
    return []
  }

  const fuse = createSearchInstance()
  const results = fuse.search(query)

  return results.slice(0, limit).map((result) => result.item)
}
