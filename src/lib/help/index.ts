// Client-safe exports (no fs/path dependencies)
export {
  helpNavigation,
  getAllHelpPages,
  getHelpPageBySlug,
  getAllHelpSlugs,
  type HelpNavItem,
  type HelpNavSection,
} from './navigation'

// Server-only exports are in ./mdx.ts - import directly:
// import { getHelpContent, ... } from '@/lib/help/mdx'
