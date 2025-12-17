# Create HeroSection Component

## Files to Modify/Create
- `src/components/hero-section.tsx` (create new)

## Implementation Details
Create a highly reusable hero section component with the following features:

- **Configurable CTAs**: Support primary and secondary call-to-action buttons with customizable text, links, and styling
- **Optional Badge**: Display a badge with Sparkles icon when provided, positioned above the title
- **Flexible Content**: Title and description support both string and JSX.Element for maximum flexibility
- **Optional Image**: Display an image with proper aspect ratio when provided
- **Background Gradient**: Apply a subtle gradient background for visual depth
- **Responsive Design**: Implement responsive text sizing that scales appropriately across devices
- **Type Safety**: Define comprehensive TypeScript interfaces for all props

Component structure:
- Container with gradient background
- Optional badge with Sparkles icon
- Title (string or JSX)
- Description (string or JSX) 
- Optional image with aspect ratio handling
- CTA buttons (primary and secondary)
- Responsive layout using Tailwind classes

## Acceptance Criteria
- Component accepts all specified props with correct TypeScript types
- Badge displays with Sparkles icon when `badge` prop is provided
- Title renders correctly as string or JSX.Element
- Description renders correctly as string or JSX.Element
- Primary and secondary CTAs render with proper styling and links
- Optional image displays with proper aspect ratio (16:9 default)
- Background gradient creates visual depth
- Responsive text sizing works across breakpoints
- TypeScript compilation passes without errors
- Component is reusable across different pages
- Follows FP principles: pure functions, immutability, no side effects
- Type annotations present and correct
- Function length ≤20 lines, nesting ≤3 levels

## Dependencies
- shadcn/ui Button component installed
- Lucide React icons available (Sparkles icon)
- Tailwind CSS configured