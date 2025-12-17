# Create SiteHeader Component

## Files to Modify/Create
- `src/components/site-header.tsx` (new)
- `src/hooks/use-mobile.ts` (new - if doesn't exist)

## Implementation Details

Create a responsive site header component with desktop and mobile navigation patterns.

### Component Structure

```typescript
// src/components/site-header.tsx
'use client';

import { NavigationMenu, NavigationMenuItem, NavigationMenuList, NavigationMenuLink } from "@/components/ui/navigation-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { GetStartedButton } from "@/components/get-started-button"
import { Menu, Sparkles } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"

export function SiteHeader() {
  const isMobile = useIsMobile()

  return (
    <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <SiteLogo />
        {isMobile ? <MobileNav /> : <DesktopNav />}
      </div>
    </header>
  )
}

function SiteLogo() {
  return (
    <div className="flex items-center gap-2">
      <Sparkles className="w-6 h-6 text-primary" />
      <span className="text-xl font-bold tracking-tight">ProductPix</span>
    </div>
  )
}

function DesktopNav() {
  return (
    <nav className="flex items-center gap-8">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#features"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#how-it-works"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              href="#pricing"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Pricing
            </NavigationMenuLink>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
      <GetStartedButton variant="default">Get Started</GetStartedButton>
    </nav>
  )
}

function MobileNav() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Menu className="w-6 h-6" />
          <span className="sr-only">Open menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent>
        <nav className="flex flex-col gap-4 mt-8">
          <a
            href="#features"
            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </a>
          <a
            href="#how-it-works"
            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            How It Works
          </a>
          <a
            href="#pricing"
            className="text-lg font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Pricing
          </a>
          <div className="pt-4">
            <GetStartedButton variant="default" className="w-full">
              Get Started
            </GetStartedButton>
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
```

### Mobile Hook (if needed)

```typescript
// src/hooks/use-mobile.ts
import { useEffect, useState } from 'react'

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  return isMobile
}
```

## Acceptance Criteria
- [ ] Component renders on desktop with horizontal navigation
- [ ] Component renders on mobile with hamburger menu and drawer
- [ ] Sticky header behavior works correctly
- [ ] Backdrop blur effect is visible
- [ ] All navigation links work
- [ ] GetStartedButton integration is functional
- [ ] TypeScript types are correct (no `any` or unguarded `unknown`)
- [ ] Accessibility: keyboard navigation works, focus states are visible

## Dependencies
- Task 01: Requires NavigationMenu and Sheet components

## Notes
- Uses `'use client'` directive for interactivity
- Mobile breakpoint is 768px (Tailwind's `md:`)
- Sticky positioning keeps header visible on scroll
- Backdrop blur creates depth hierarchy
