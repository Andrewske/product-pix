# ProductPix Landing Page Implementation Plan

## Overview

Build a simple, elegant landing page for ProductPix - an AI product photo generator targeting Poshmark, eBay, and Etsy resellers. The page should reflect the product's simplicity: minimal, fast, no-nonsense.

**Primary Goal**: Free signup (users get 5 free credits)

**Tech Stack**: Next.js 16, shadcn/ui, Tailwind v4

**Design Direction**:
- Light mode primary (clean, bright, approachable)
- Professional yet friendly aesthetic
- Mobile-first, fully responsive

---

## Target Audience

Individual resellers on Poshmark, eBay, Etsy who:
- Shoot products with phones
- Deal with inconsistent lighting/backgrounds
- Don't have time or budget for professional photography
- List multiple items regularly
- Value simplicity over feature complexity

---

## Key Messaging Hierarchy

### Primary Value Prop
"Professional product photos in one click."

### Secondary Messages (in order of importance)
1. **Simplicity**: "Upload. Done." - No learning curve, optional style choices
2. **Consistency**: "Every product, same professional look" - Catalog uniformity
3. **Transparency**: "Credits never expire. No subscriptions required." - Simple pricing
4. **Trust**: "Your product, enhanced—not invented" - AI respects the original

### Tagline Candidates (pick one)
- "Upload. Enhance. Sell."
- "Your photos, but better."
- "Studio quality. Phone effort."

---

## Page Structure

### 1. Hero Section
**Purpose**: Immediate clarity on what this is + primary CTA

**Content**:
- Headline: "Professional Product Photos in Seconds"
- Subheadline: "Upload your product photo, get studio-quality results instantly. No design skills needed."
- Primary CTA: "Get 5 Free Photos" (button → signup)
- Secondary CTA: "See Examples" (scroll to before/after section)

**Visual**:
- Single before/after image transformation (animated or slider)
- Keep it clean - one powerful example, not a gallery
- Clean, professional aesthetic without being corporate

**Implementation Notes**:
- Mobile: Stack vertically, before/after prominent
- Desktop: Hero fills viewport, before/after side by side
- Before/after can use a draggable slider component

---

### 2. How It Works
**Purpose**: Reinforce simplicity, reduce perceived friction

**Content** (3 steps):
1. **Upload** - "Drop your product photo"
2. **Style (Optional)** - "Pick a template or use our default"
3. **Download** - "Get your professional photo"

**Visual**:
- Simple icons or minimal illustrations
- Numbered steps with clean typography

**Implementation Notes**:
- Mobile: Vertical stack
- Desktop: Horizontal layout
- Keep animations subtle

---

### 3. Pricing Section
**Purpose**: Transparent pricing builds trust, pre-qualifies buyers

**Content**: Loaded dynamically from Stripe via `src/lib/pricing/`

**Key Messages**:
- "Start free with 5 credits"
- "Credits never expire"
- "No subscriptions. Just buy what you need."

**Layout**:
- Clean pricing cards
- Highlight best value tier
- Show per-credit cost prominently

**Implementation Notes**:
- Pull pricing data from existing pricing config (synced with Stripe)
- Don't over-design - clarity > decoration
- Mobile: Stack cards vertically
- Desktop: Horizontal card layout

---

### 4. Final CTA Section
**Purpose**: Convert scrollers who made it to the bottom

**Content**:
- Headline: "Ready to upgrade your listings?"
- Subheadline: "Get 5 free photos. No credit card required."
- CTA Button: "Get Started Free"

**Visual**:
- Full-width section
- Subtle accent background
- Keep it simple and direct

---

### 5. Footer
**Purpose**: Standard footer with legal/navigation

**Content**:
- Logo
- Navigation: Pricing, Login, Sign Up
- Legal: Terms, Privacy
- Contact/Support link
- Copyright

**Implementation Notes**:
- Minimal footer - don't over-stuff

---

## Design System Notes

### Colors (Light Theme)
- Background: Clean white or soft gray (gray-50)
- Cards/Surfaces: White with subtle shadows
- Primary accent: Teal or blue for trust/professionalism
- Text: Dark gray hierarchy (gray-900, gray-600)
- CTA: Bright accent that pops against light background

### Typography
- Clean sans-serif (Inter, system-ui)
- Large headlines for impact
- Generous whitespace
- Limit to 2-3 font sizes for simplicity

### Components to Use (shadcn/ui)
- Button (primary CTA style)
- Card (pricing)
- Badge (for "Best Value")
- Carousel/Slider for before/after

### Animations
- Subtle and purposeful
- Consider: fade-in on scroll, hover states, before/after transitions
- Avoid: excessive movement
- Keep it simple - no Framer Motion unless necessary

---

## File Structure

```
src/app/page.tsx              # Landing page (replaces current homepage)
src/components/ui/            # Reuse existing shadcn components
```

Keep it simple - all sections inline in page.tsx or extract to local components only if they become unwieldy.

---

## Before/After Image Assets

6 examples available in R2 (from prompt-bench testing):

```typescript
const examples = [
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/6e4804c5e0d7a3e1e503e60a376fbf0afb43f0615ebf386b6b10f106f9dbc80b.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/6d6fb777-06f5-4805-bd80-90a1f64da8d1.png",
    product: "Burr Coffee Grinder",
    category: "Appliances"
  },
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/6fbf2a1b0f5196f867a1f5a41669a29bebda0eae0eb9fe77c88282ca46e43671.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/856e29dc-a4bb-414c-9393-3045d84aacbf.png",
    product: "Espresso Machine",
    category: "Appliances"
  },
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/ffb69068ef4b0e9511d6198bc12b0068fe65a5365c6339f22c3ec2cc1ce1222e.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
    product: "Peanut Butter Jar",
    category: "Food/Consumer"
  },
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/2ff87f3c94af94aaaf868eab386aa813c2ebb7993b8c5bdf59ba7ea23459d1ba.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/4ac37349-59d0-4885-b007-3132800ff08c.png",
    product: "Air Purifier",
    category: "Appliances"
  },
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/5e82a43b37e6fb7d9df372afa103be6b9592b0f0cd1bddf3daf92c2912240028.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/a4000c64-a864-4316-aed0-c2af4267b96e.png",
    product: "Monos Suitcase",
    category: "Luggage"
  },
  {
    before: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/a5b31c3b8e7b1992db3ea4be519188a6930c8a27694439a986f1cad595debdd9.jpg",
    after: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/088c3cb1-3ae9-4729-af72-817d08fed087.png",
    product: "Computer Monitor",
    category: "Electronics"
  }
]
```

**Recommended for landing page**: Coffee Grinder, Espresso Machine, Peanut Butter Jar (highest scoring, best transformations)

---

## Implementation Priorities

### Phase 1: MVP (5 sections)
1. Hero with single before/after + CTA
2. How it works (3 steps)
3. Pricing section (from Stripe)
4. Final CTA
5. Footer

### Phase 2: Enhancements
1. Before/after showcase section (carousel with multiple examples)
   - Horizontal scroll carousel or grid
   - Interactive slider (drag to reveal)
   - Use all 6 R2 examples
2. Subtle animations (fade-in on scroll, hover states)
3. Video demo (optional - 15-second screen recording of workflow)

### Phase 3: Future
1. Real testimonials (when available)
2. "Photos generated" counter
3. A/B test variations

---

## Copy Bank

### Headlines
- "Professional Product Photos in Seconds"
- "Your Products Deserve Better Photos"
- "Studio-Quality Photos. Phone-Quality Effort."

### Subheadlines
- "Upload your product photo, get studio-quality results instantly."
- "Transform phone photos into professional listings"
- "The fastest way to better product photos"

### CTAs
- "Get 5 Free Photos"
- "Get Started Free"
- "Try It Free"

### Trust Builders
- "Credits never expire"
- "No credit card required"
- "No subscriptions"
- "5 free photos to start"

### Value Props
- "One click. Professional results."
- "One credit. One photo. Simple."
- "Every product, same professional look"
- "Your product, enhanced—not invented"

---

## Implementation Decisions

- **Landing page replaces the current homepage** (`src/app/page.tsx`)
- **All CTAs go to signup** (not directly to Stripe)
- Users sign up first → get 5 free credits → then can purchase more if needed
- Use existing auth flow (`/login`, `/signup`)
- **Pricing loaded from Stripe** via existing `src/lib/pricing/` config
- **No subscriptions for MVP** - one-time credit packs only

---

## SEO Requirements

### Meta Tags
- Title: "ProductPix - Professional Product Photos in Seconds"
- Description: "Transform phone photos into studio-quality product images. Perfect for Poshmark, eBay, and Etsy sellers. Get 5 free photos."
- Keywords: product photography, AI photo enhancement, e-commerce photos, Poshmark, eBay, Etsy

### Open Graph
- og:title, og:description, og:image (use best before/after example)
- og:type: website

### Technical SEO
- Semantic HTML (h1, h2, section, nav, footer)
- Alt text on all images
- Fast loading (optimize images with next/image)
- Mobile-friendly (responsive design)

---

## Reference

- Existing app routes: `/generate`, `/dashboard`, `/batch`, `/pricing`
- Existing components: Check `src/components/` for reusable pieces
- Pricing config: `src/lib/pricing/`
- Auth: Supabase-based, existing hooks in `src/lib/auth/`
