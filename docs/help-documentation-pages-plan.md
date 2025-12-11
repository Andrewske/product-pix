# Help Documentation Pages Implementation Plan

## Overview

Add in-app help documentation at `/help/*` routes using MDX content with sidebar navigation and client-side search. Core workflows only (~6 pages) for MVP launch.

## Architecture Decisions

- **MDX over pure React**: Easier content maintenance, supports embedded React components
- **Content in `src/content/help/`**: Separates content from routing logic, enables search indexing
- **fuse.js over Algolia**: Lightweight client-side search sufficient for 6 pages, no external dependency
- **Existing shadcn Sidebar**: Reuse `sidebar.tsx` components with built-in mobile Sheet support
- **`next.config.mjs`**: Required for ESM imports of remark/rehype plugins

## Implementation Tasks

### Phase 1: Foundation

- [ ] Install dependencies
  - Command: `bun add @next/mdx @mdx-js/loader @mdx-js/react fuse.js gray-matter remark-gfm rehype-slug rehype-autolink-headings`
  - Acceptance: All packages in package.json, no version conflicts

- [ ] Convert next.config.ts to next.config.mjs with MDX support
  - Files: `next.config.ts` → `next.config.mjs` (rename + modify)
  - Acceptance: `bun build` succeeds, MDX files can be imported
  - Implementation:
    ```javascript
    import createMDX from '@next/mdx'
    import remarkGfm from 'remark-gfm'
    import rehypeSlug from 'rehype-slug'
    import rehypeAutolinkHeadings from 'rehype-autolink-headings'

    const nextConfig = {
      pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
      typescript: { tsconfigPath: './tsconfig.build.json' },
      images: {
        remotePatterns: [{
          protocol: 'https',
          hostname: 'pub-76304578acde4439afba93b377f6b24c.r2.dev',
          port: '',
          pathname: '/**',
        }],
      },
    }

    const withMDX = createMDX({
      options: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { behavior: 'wrap' }]],
      },
    })

    export default withMDX(nextConfig)
    ```

- [ ] Create mdx-components.tsx
  - Files: `src/mdx-components.tsx` (new)
  - Acceptance: TypeScript compiles, exports `useMDXComponents` function
  - Implementation: Override h1-h3, p, a, ul, ol, code, pre with styled versions using design system colors

- [ ] Create navigation config
  - Files: `src/lib/help/navigation.ts` (new), `src/lib/help/index.ts` (new)
  - Tests: `src/lib/help/__tests__/navigation.test.ts`
  - Acceptance: Exports `helpNavigation` array with 4 sections, 6 items total

- [ ] Create content directory structure
  - Files: `src/content/help/.gitkeep` (new)
  - Acceptance: Directory exists

### Phase 2: Layout & Navigation

- [ ] Create help layout with sidebar
  - Files: `src/app/help/layout.tsx` (new)
  - Acceptance: Renders sidebar on left, content area on right, mobile Sheet behavior works
  - Dependencies: Requires help-sidebar.tsx, help-search.tsx
  - Implementation: Use SidebarProvider, Sidebar, SidebarContent, SidebarInset from existing sidebar.tsx

- [ ] Create help sidebar component
  - Files: `src/components/help/help-sidebar.tsx` (new), `src/components/help/index.ts` (new)
  - Tests: `src/components/help/__tests__/help-sidebar.test.tsx`
  - Acceptance: Renders all nav sections, highlights active item based on pathname
  - Dependencies: Requires navigation.ts

- [ ] Create help index page
  - Files: `src/app/help/page.tsx` (new)
  - Acceptance: Redirects to /help/getting-started

- [ ] Create dynamic MDX page renderer
  - Files: `src/app/help/[...slug]/page.tsx` (new)
  - Files: `src/lib/help/mdx.ts` (new)
  - Tests: `src/lib/help/__tests__/mdx.test.ts`
  - Acceptance: Renders MDX content for valid slugs, returns 404 for invalid slugs
  - Implementation:
    - `getHelpContent(slug)`: Read MDX file, parse frontmatter with gray-matter
    - `generateStaticParams()`: Return all valid slugs for static generation
    - `generateMetadata()`: Extract title/description from frontmatter

### Phase 3: MDX Components

- [ ] Create Callout component
  - Files: `src/components/help/mdx/callout.tsx` (new), `src/components/help/mdx/index.ts` (new)
  - Tests: `src/components/help/mdx/__tests__/callout.test.tsx`
  - Acceptance: Renders 4 variants (info, warning, tip, success) with correct icons and colors
  - Implementation: Extend existing Alert component, add variant-based styling

- [ ] Create Step indicator components
  - Files: `src/components/help/mdx/step-indicator.tsx` (new)
  - Tests: `src/components/help/mdx/__tests__/step-indicator.test.tsx`
  - Acceptance: Renders numbered steps with title and content, coral accent color on numbers

- [ ] Create ImageFrame component
  - Files: `src/components/help/mdx/image-frame.tsx` (new)
  - Tests: `src/components/help/mdx/__tests__/image-frame.test.tsx`
  - Acceptance: Renders image with border, optional caption, responsive sizing

- [ ] Register MDX components
  - Files: `src/mdx-components.tsx` (modify)
  - Acceptance: Callout, Steps, Step, ImageFrame available in MDX files

### Phase 4: Search

- [ ] Create search utilities
  - Files: `src/lib/help/search.ts` (new)
  - Tests: `src/lib/help/__tests__/search.test.ts`
  - Acceptance: `buildSearchIndex()` returns flat array, `createSearchInstance()` returns Fuse instance
  - Implementation:
    - Flatten helpNavigation into searchable items
    - Configure Fuse with keys: title (0.4), description (0.3), section (0.2)
    - Threshold: 0.4 for fuzzy matching

- [ ] Create search component
  - Files: `src/components/help/help-search.tsx` (new)
  - Tests: `src/components/help/__tests__/help-search.test.tsx`
  - Acceptance: Input shows results dropdown, clicking result navigates, keyboard navigation works
  - Implementation:
    - Debounced input (150ms)
    - Show top 5 results
    - Click outside closes dropdown

### Phase 5: Content

- [ ] Write getting-started.mdx
  - Files: `src/content/help/getting-started.mdx` (new)
  - Acceptance: Renders correctly, includes Quick Start callout, 3-step workflow
  - Content outline:
    - What ProductPix does
    - Quick start steps (upload → style → generate)
    - Understanding credits
    - Links to other sections

- [ ] Write single-image-generation.mdx
  - Files: `src/content/help/single-image-generation.mdx` (new)
  - Acceptance: Renders correctly, covers all generation options
  - Content outline:
    - Step-by-step workflow with Step components
    - Supported formats (PNG, JPG, WebP)
    - Aspect ratios table
    - Resolution tiers and costs
    - Tips for best results

- [ ] Write batch-processing.mdx
  - Files: `src/content/help/batch-processing.mdx` (new)
  - Acceptance: Renders correctly, includes CSV format example
  - Content outline:
    - When to use batch vs single
    - CSV format specification
    - Creating a batch walkthrough
    - Monitoring progress
    - Downloading results

- [ ] Write credits-pricing.mdx
  - Files: `src/content/help/credits-pricing.mdx` (new)
  - Acceptance: Renders correctly, pricing tables accurate
  - Content outline:
    - How credits work (never expire)
    - Credit costs by resolution
    - Credit packs table
    - Subscription tiers table
    - Viewing balance and history

- [ ] Write account-management.mdx
  - Files: `src/content/help/account-management.mdx` (new)
  - Acceptance: Renders correctly, covers all settings
  - Content outline:
    - Profile settings
    - Changing email/password
    - Billing history access
    - Managing subscriptions
    - Account deletion

- [ ] Write faq.mdx
  - Files: `src/content/help/faq.mdx` (new)
  - Acceptance: Renders correctly, expandable sections work
  - Content outline:
    - Generation failures
    - Refund policy
    - Best image formats
    - Generation times
    - Image privacy

### Phase 6: Integration & Polish

- [ ] Add help link to main navigation
  - Files: `src/components/layout-wrapper.tsx` or main nav component (modify)
  - Acceptance: Help link visible in main app header/nav

- [ ] Add mobile sidebar trigger
  - Files: `src/app/help/layout.tsx` (modify)
  - Acceptance: Hamburger menu visible on mobile, opens sidebar Sheet

- [ ] Add CSS variables for callout colors if missing
  - Files: `src/app/globals.css` (modify if needed)
  - Acceptance: --info, --success variables exist for callout styling

## Acceptance Criteria

- [ ] All tests pass (`bun test`)
- [ ] No TypeScript errors (`bun build`)
- [ ] Coverage ≥75% for new code
- [ ] Help pages accessible at /help/*
- [ ] Sidebar navigation works on desktop and mobile
- [ ] Search finds content across all pages
- [ ] All 6 help pages render correctly with styled MDX

## Files to Create

| File | Type |
|------|------|
| `next.config.mjs` | Rename from .ts |
| `src/mdx-components.tsx` | New |
| `src/app/help/layout.tsx` | New |
| `src/app/help/page.tsx` | New |
| `src/app/help/[...slug]/page.tsx` | New |
| `src/components/help/index.ts` | New |
| `src/components/help/help-sidebar.tsx` | New |
| `src/components/help/help-search.tsx` | New |
| `src/components/help/mdx/index.ts` | New |
| `src/components/help/mdx/callout.tsx` | New |
| `src/components/help/mdx/step-indicator.tsx` | New |
| `src/components/help/mdx/image-frame.tsx` | New |
| `src/lib/help/index.ts` | New |
| `src/lib/help/navigation.ts` | New |
| `src/lib/help/search.ts` | New |
| `src/lib/help/mdx.ts` | New |
| `src/content/help/getting-started.mdx` | New |
| `src/content/help/single-image-generation.mdx` | New |
| `src/content/help/batch-processing.mdx` | New |
| `src/content/help/credits-pricing.mdx` | New |
| `src/content/help/account-management.mdx` | New |
| `src/content/help/faq.mdx` | New |

## Files to Modify

| File | Changes |
|------|---------|
| `next.config.ts` | Delete (replaced by .mjs) |
| `src/app/globals.css` | Add --info, --success CSS vars if missing |
| Main nav component | Add help link |

## Dependencies

### External (npm)
- `@next/mdx` - Next.js MDX integration
- `@mdx-js/loader` - MDX webpack loader
- `@mdx-js/react` - MDX React runtime
- `fuse.js` - Client-side fuzzy search
- `gray-matter` - Frontmatter parsing
- `remark-gfm` - GitHub Flavored Markdown
- `rehype-slug` - Add IDs to headings
- `rehype-autolink-headings` - Link headings

### Internal (existing)
- `src/components/ui/sidebar.tsx` - Reuse sidebar components
- `src/components/ui/alert.tsx` - Base for Callout
- `src/components/ui/input.tsx` - Search input
- `src/lib/utils.ts` - cn() utility

## Task Dependencies Graph

```
Phase 1 (Foundation)
├── Install deps
├── next.config.mjs ──┐
├── mdx-components.tsx ├──→ Phase 2
├── navigation.ts ────┘
└── content dir

Phase 2 (Layout)
├── help-sidebar.tsx ──┐
├── help-search.tsx ───┼──→ layout.tsx ──→ Phase 6
├── page.tsx ──────────┤
└── [...slug]/page.tsx ┘

Phase 3 (MDX Components)
├── callout.tsx ───────┐
├── step-indicator.tsx ├──→ Update mdx-components.tsx ──→ Phase 5
└── image-frame.tsx ───┘

Phase 4 (Search)
├── search.ts ─────────┐
└── help-search.tsx ◄──┘ (already in Phase 2, add search logic)

Phase 5 (Content) ──→ Phase 6 (Polish)
```
