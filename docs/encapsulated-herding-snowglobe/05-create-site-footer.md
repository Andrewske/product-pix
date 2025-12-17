# Create SiteFooter Component

## Files to Modify/Create
- `src/components/site-footer.tsx` (new)

## Implementation Details

Create a reusable site footer component with configurable sections and proper use of Separator component.

### Component Implementation

```typescript
// src/components/site-footer.tsx
import { Separator } from "@/components/ui/separator"
import { Sparkles } from "lucide-react"

interface FooterLink {
  label: string
  href: string
}

interface FooterSection {
  title: string
  links: FooterLink[]
}

interface SiteFooterProps {
  sections?: FooterSection[]
}

const defaultSections: FooterSection[] = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Examples", href: "#examples" },
    ]
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ]
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Refunds", href: "/refunds" },
    ]
  }
]

export function SiteFooter({ sections = defaultSections }: SiteFooterProps) {
  return (
    <footer className="border-t border-border/40 bg-background py-16">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-12 mb-16">
          <FooterBrand />
          {sections.map((section) => (
            <FooterColumn key={section.title} {...section} />
          ))}
        </div>
        <Separator className="mb-8" />
        <FooterBottom />
      </div>
    </footer>
  )
}

function FooterBrand() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-primary" />
        <span className="text-lg font-bold tracking-tight">ProductPix</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Professional product photography powered by AI. Transform your listings in seconds.
      </p>
    </div>
  )
}

function FooterColumn({ title, links }: FooterSection) {
  return (
    <div>
      <h3 className="font-semibold mb-4 text-foreground">{title}</h3>
      <ul className="space-y-3">
        {links.map((link) => (
          <li key={link.label}>
            <a
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function FooterBottom() {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
      <p>© {new Date().getFullYear()} ProductPix. All rights reserved.</p>
      <div className="flex gap-6">
        <a href="/privacy" className="hover:text-foreground transition-colors">
          Privacy Policy
        </a>
        <a href="/terms" className="hover:text-foreground transition-colors">
          Terms of Service
        </a>
      </div>
    </div>
  )
}
```

## Acceptance Criteria
- [ ] Footer renders with all sections correctly
- [ ] Separator component divides main content from bottom area
- [ ] Grid layout works responsively (4 columns on md+, stacked on mobile)
- [ ] All links have proper hover states
- [ ] Brand section displays logo and tagline
- [ ] Default sections can be overridden via props
- [ ] TypeScript types are correct (no `any` or unguarded `unknown`)
- [ ] Footer is reusable across pages
- [ ] Current year displays dynamically

## Dependencies
- Task 01: Requires Separator component

## Notes
- Uses `defaultSections` for easy setup but allows customization
- Responsive grid: `md:grid-cols-4` stacks on mobile
- Separator provides visual hierarchy between sections
- FooterBottom includes copyright and legal links
- Can be imported and used in any page layout
