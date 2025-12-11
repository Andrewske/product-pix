export type HelpNavItem = {
  title: string
  href: string
  description: string
}

export type HelpNavSection = {
  title: string
  items: HelpNavItem[]
}

export const helpNavigation: HelpNavSection[] = [
  {
    title: 'Getting Started',
    items: [
      {
        title: 'Introduction',
        href: '/help/getting-started',
        description: 'Learn the basics of ProductPix and get up and running quickly',
      },
    ],
  },
  {
    title: 'Creating Images',
    items: [
      {
        title: 'Single Image Generation',
        href: '/help/single-image-generation',
        description: 'Generate professional product photos one at a time',
      },
      {
        title: 'Batch Processing',
        href: '/help/batch-processing',
        description: 'Process multiple products efficiently with CSV uploads',
      },
    ],
  },
  {
    title: 'Billing',
    items: [
      {
        title: 'Credits & Pricing',
        href: '/help/credits-pricing',
        description: 'Understand how credits work and view pricing options',
      },
    ],
  },
  {
    title: 'Account',
    items: [
      {
        title: 'Account Management',
        href: '/help/account-management',
        description: 'Manage your profile, settings, and subscriptions',
      },
      {
        title: 'FAQ',
        href: '/help/faq',
        description: 'Frequently asked questions and troubleshooting',
      },
    ],
  },
]

// Flat list of all help pages for search indexing
export const getAllHelpPages = (): HelpNavItem[] => {
  return helpNavigation.flatMap((section) => section.items)
}

// Get a specific help page by slug
export const getHelpPageBySlug = (slug: string): HelpNavItem | undefined => {
  const href = `/help/${slug}`
  return getAllHelpPages().find((item) => item.href === href)
}

// Get all valid slugs for static generation
export const getAllHelpSlugs = (): string[] => {
  return getAllHelpPages().map((item) => item.href.replace('/help/', ''))
}
