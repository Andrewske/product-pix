# Create FeatureCard Component

## Files to Modify/Create
- `src/components/feature-card.tsx` (new)

## Implementation Details

Create a reusable feature card component with proper image handling, hover states, and type-safe props.

### Component Implementation

```typescript
// src/components/feature-card.tsx
import { Card } from "@/components/ui/card"
import { AspectRatio } from "@/components/ui/aspect-ratio"
import { Badge } from "@/components/ui/badge"
import { ArrowUpRight, ImageIcon } from "lucide-react"
import Image from "next/image"

interface FeatureCardProps {
  title: string
  description: string
  imageSrc?: string
  imageAlt?: string
  badge?: string
}

export function FeatureCard({
  title,
  description,
  imageSrc,
  imageAlt = "",
  badge
}: FeatureCardProps) {
  return (
    <div className="group cursor-pointer">
      <Card className="rounded-2xl overflow-hidden mb-6 relative hover:border-primary/50 transition-colors">
        <AspectRatio ratio={4/5}>
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt}
              fill
              className="object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
              <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
            </div>
          )}
        </AspectRatio>
        {badge && (
          <Badge
            variant="outline"
            className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur"
          >
            {badge} <ArrowUpRight className="w-3 h-3 ml-1" />
          </Badge>
        )}
      </Card>
      <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
```

## Acceptance Criteria
- [ ] Component accepts all specified props with correct TypeScript types
- [ ] AspectRatio maintains 4:5 ratio for all images
- [ ] Placeholder shows ImageIcon when no image is provided
- [ ] Hover state changes border color to primary/50
- [ ] Badge appears on hover with smooth transition
- [ ] Title changes to primary color on hover
- [ ] No TypeScript errors (no `any` or unguarded `unknown`)
- [ ] Works with both local and remote image URLs
- [ ] Optional props (imageSrc, imageAlt, badge) work correctly

## Dependencies
- Task 01: Requires AspectRatio component
- Existing Badge and Card components

## Notes
- Uses Next.js Image component for optimization
- 4:5 aspect ratio is ideal for product photography
- Placeholder state provides fallback for missing images
- Group hover pattern creates cohesive interaction
- Badge with backdrop blur ensures visibility on any background
