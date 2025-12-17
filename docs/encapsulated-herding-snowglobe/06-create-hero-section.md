# Create HeroSection Component

## Files to Modify/Create
- `src/components/hero-section.tsx` (new)

## Implementation Details

Create a highly reusable hero section component with configurable CTAs, optional badge, and image support.

### Component Implementation

```typescript
// src/components/hero-section.tsx
import { Badge } from "@/components/ui/badge"
import { Sparkles } from "lucide-react"
import Image from "next/image"

interface HeroSectionProps {
  badge?: string
  title: string | React.ReactNode
  description: string | React.ReactNode
  primaryCta: React.ReactNode
  secondaryCta?: React.ReactNode
  imageSrc?: string
  imageAlt?: string
}

export function HeroSection({
  badge,
  title,
  description,
  primaryCta,
  secondaryCta,
  imageSrc,
  imageAlt = ""
}: HeroSectionProps) {
  return (
    <section className="w-full relative overflow-hidden py-32 bg-background">
      <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <div className="text-center space-y-8">
          <div className="space-y-6">
            {badge && (
              <Badge
                variant="default"
                className="inline-flex items-center gap-2 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>{badge}</span>
              </Badge>
            )}

            <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none text-balance font-display">
              {title}
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
              {description}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            {primaryCta}
            {secondaryCta}
          </div>

          {imageSrc && (
            <div className="mt-16 flex justify-center">
              <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
                <Image
                  src={imageSrc}
                  alt={imageAlt}
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
```

## Acceptance Criteria
- [ ] Component accepts all specified props with correct TypeScript types
- [ ] Badge displays with Sparkles icon when provided
- [ ] Title supports both string and JSX (e.g., line breaks, colored spans)
- [ ] Description supports both string and JSX
- [ ] Primary and secondary CTAs render correctly
- [ ] Optional image displays with proper aspect ratio
- [ ] Background gradient creates depth
- [ ] Responsive text sizing works (6xl → 8xl on md+)
- [ ] TypeScript types are correct (no `any` or unguarded `unknown`)
- [ ] Component is reusable across different pages

## Dependencies
- Existing Badge component

## Notes
- Uses `text-balance` for better title wrapping
- `font-display` assumes Figtree is loaded (per design system)
- `font-light` for description creates visual hierarchy
- Image uses `priority` for LCP optimization on homepage
- Gradient provides subtle depth without overwhelming content
- CTA buttons passed as ReactNode for maximum flexibility

## Usage Example

```typescript
<HeroSection
  badge="AI-Powered Studio Photography"
  title={
    <>
      Professional Photos
      <br />
      <span className="text-primary">in Seconds</span>
    </>
  }
  description="Transform ordinary snapshots into high-end studio photography."
  primaryCta={
    <GetStartedButton size="lg" variant="default">
      Start Creating Free
    </GetStartedButton>
  }
  secondaryCta={
    <Button size="lg" variant="outline">
      View Gallery
    </Button>
  }
  imageSrc="/hero-image.jpg"
  imageAlt="Professional product photography showcase"
/>
```
