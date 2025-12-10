# Landing Page Redesign - Design Document

**Date:** 2025-12-10
**Status:** Approved for Implementation

## Overview

Redesign ProductPix landing page with "Scroll Story" approach to establish indie SaaS credibility through polished design, clear value demonstration, and authentic trust signals.

## Product Context

**What we do:** Instant studio transformation for product photos (full scene generation, not enhancement)

**Target audience:** Casual resellers → power sellers (Poshmark/eBay/Etsy)

**Brand personality:** Enthusiast + Friend + Wizard = "Friendly magic that gets you excited"

**Primary action:** Sign up (with 5 free credits) - no anonymous generation

**Business goal:** Indie SaaS credibility - polished enough to trust, human enough to root for

## Design System

### Visual Identity

**Color Palette:**
- Base background: `#1a1a1a` (dark charcoal)
- Card surfaces: `#2a2a2a` (lighter grey, subtle elevation)
- Accent (CTAs, highlights): `#1DB954` (vibrant green, Spotify-inspired)
- Text primary: `#e5e5e5` (off-white)
- Text muted: `#888888` (grey)
- Borders: Subtle, warm-toned dividers (not harsh white)

**Vibe:** Dim mode - Spotify meets Raycast (dark but inviting, not gloomy)

**Typography:**
- Font family: Clean sans-serif (Inter, Satoshi, or similar)
- Hierarchy: Bold headlines, comfortable body text
- Mobile-optimized line heights

**Layout Principles:**
- Mobile-first (vertical scroll narrative)
- Generous whitespace
- Product imagery as hero elements
- Subtle scroll-triggered animations (no gimmicks)

### Trust Elements

**What we can claim:**
- Powered by Google Gemini AI
- Commercial license included
- Instant credit refunds if unsatisfied
- 30-day photo storage (framed as privacy feature)
- Stripe secure payments

**What we DON'T have yet:**
- Customer testimonials
- Usage statistics
- Social proof

**Strategy:** Build credibility through design quality and transparent claims, not borrowed trust.

## Page Structure

### 1. Hero / Above the Fold

**Goal:** Hook users immediately with visual proof + clear value

**Layout (mobile-first):**
```
[Background: Dark charcoal with subtle green radial glow]

         Headline
         ↓
    [Before/After Slider]
         ↓
       Subheadline
         ↓
    [CTA Button - Green]
         ↓
      Trust subtext
         ↓
    [Scroll indicator]
```

**Copy:**
- **Headline:** "Your Phone Photo → Professional Studio"
  *(Large, bold, simple visual metaphor)*
- **Subheadline:** "AI-powered product backgrounds in 30 seconds"
- **CTA:** "Get 5 Free Photos →" *(filled green button)*
- **Trust subtext:** "No credit card • Powered by Gemini • Download instantly"

**Visual:**
- ONE stunning before/after slider (full width on mobile, max-width on desktop)
- Subtle radial green glow behind slider (~10% opacity)
- Touch-friendly slider interaction

**Why this works:**
- ONE clear promise, ONE clear action
- Before/after does heavy lifting
- Trust signals address immediate objections
- Green CTA pops against dark background

---

### 2. Scroll Reveal Examples

**Goal:** Progressive proof across different product categories

**Layout:**
Vertical stack of 3-4 before/after examples, each with:
- Staggered fade-in animations (left, right, center)
- Full-width on mobile (with padding)
- Offset left/right on desktop for visual rhythm
- Generous whitespace between examples

**Example captions:**
- "Vintage Clothing → Studio Ready"
- "Phone Case → E-commerce Quality"
- "Handmade Mug → Professional Listing"

**Diversity:** Show different product types (clothing, accessories, home goods, electronics)

**Why this works:**
- Natural mobile scroll behavior
- Each example reinforces versatility
- Captions help users self-identify ("That's my use case")
- Staggered animations feel polished

---

### 3. How It Works (Integrated)

**Goal:** Show the process with real examples, not abstract icons

**Layout:**
Three visual moments, vertically stacked on mobile:

**Step 1: Upload**
- Visual: Phone with photo being uploaded + raw "before" photo
- Caption: "Upload from your phone"
- Subcopy: "No setup, no equipment. Just your product."

**Step 2: Transform**
- Visual: Split-screen with subtle "AI thinking" shimmer animation
- Caption: "AI generates studio scene"
- Subcopy: "Powered by Gemini. Takes ~30 seconds."

**Step 3: Download**
- Visual: Final "after" photo with download icon overlay
- Caption: "Download & list immediately"
- Subcopy: "High-res, commercial license included."

**Background:** Slightly lighter charcoal (`#242424`) to differentiate from examples

**Why this works:**
- Real photos maintain credibility
- Naturally mentions key benefits (Gemini, speed, license)
- Feels like story continuation, not "marketing section"
- Shows magic without demystifying

---

### 4. Trust Strip

**Goal:** Consolidate credibility signals before asking for money

**Layout:**
Horizontal strip (subtle border top/bottom) with 5 evenly spaced badges:

1. **Gemini Badge:** "Powered by Google Gemini" + logo
2. **Commercial License:** Icon + "Use commercially"
3. **Refund Policy:** Icon + "Don't like it? Refund instantly"
4. **Privacy:** Icon + "Photos deleted after 30 days"
5. **Stripe Badge:** "Secure payments" + Stripe logo

**Style:**
- Simple line icons (muted green or off-white)
- Small, clean typography
- Mobile: Stack vertically or horizontal scroll carousel
- Optional: Subtle hover states on desktop

**Placement:** Immediately before pricing section

**Why this works:**
- Addresses 5 key objections in one scannable section
- Clean, professional without being corporate
- Mobile-friendly layout

---

### 5. Pricing

**Goal:** Clear value communication, emphasis on best-value tier

**Header:**
- **Title:** "Simple Pricing"
- **Subtitle:** "Start with 5 free photos. Then buy credits as you need them."

**Three cards (vertical stack on mobile, horizontal on desktop):**

#### Pack 1 - Starter (left)
- "50 Credits"
- "$5"
- "50 photos"
- "$0.10 per photo"
- Features: ✓ Commercial license, ✓ Never expires
- CTA: "Get Started" (outline button)

#### Pack 2 - Best Value (center, emphasized)
- Green border + subtle glow
- Badge at top: "Best Value" (green background)
- "200 Credits"
- "$15"
- "200 photos"
- "$0.07 per photo"
- Features: ✓ Commercial license, ✓ Never expires
- CTA: "Get Started" (filled green button)

#### Pack 3 - Power Seller (right)
- "500 Credits"
- "$30"
- "500 photos"
- "$0.06 per photo"
- Features: ✓ Commercial license, ✓ Never expires
- CTA: "Get Started" (outline button)

**Below cards:**
"All plans include commercial license • 30-day storage • Instant refunds"

**Card style:**
- Background: `#2a2a2a`
- Best Value card: Green border (`#1DB954`) + glow
- Checkmarks: Green accent
- Emphasis on per-photo pricing (real value story)

**Why this works:**
- Free credits mentioned but not a "tier" (sets expectation)
- Center emphasis guides to best value
- "Never expires" addresses SaaS fatigue
- Mobile stack makes comparison easy

---

### 6. Final CTA

**Goal:** Last conversion opportunity for scrollers

**Layout:**
Full-width section, centered content, vertical stack on mobile.

**Background:** Return to darker charcoal (`#1a1a1a`) with subtle green glow (visual bookend with hero)

**Copy:**
- **Headline:** "Ready to Transform Your Listings?"
- **Subheading:** "Join sellers creating professional product photos in seconds."
- **CTA Button:** "Get 5 Free Photos →" (large, green)
- **Below button:** "No credit card required • Takes 30 seconds to start"

**Spacing:** Generous padding above/below

**Why this works:**
- Reinforces core promise
- Social proof hint without fake testimonials
- Re-emphasizes free trial
- Clean, focused, no distractions

---

### 7. Footer

**Goal:** Minimal but functional - honest about being indie

**Layout:**
Single row on desktop, stacks on mobile.

**Content:**

**Left: Brand**
- "ProductPix" wordmark
- Tagline: "AI Product Photography"

**Center: Navigation**
- Pricing (anchor link)
- Login
- Sign Up

**Right: Legal**
- Terms
- Privacy

**Bottom:**
- "© 2025 ProductPix. All rights reserved."

**Style:**
- Text: Muted grey (`#888`) with hover → off-white
- Simple underline on hover
- Comfortable padding

**What NOT to include:**
- Social media (don't have yet)
- About/Blog/Careers (solo dev, keep honest)
- Newsletter (don't promise content)

**Why this works:**
- Clean, honest, functional
- Doesn't pretend to be bigger than reality
- Easy to expand later

---

## Content Requirements

### Example Images Needed
- **Hero:** 1 showstopper before/after (highest quality)
- **Scroll examples:** 3-4 diverse product types
  - Vintage clothing
  - Accessories (phone case, jewelry, etc.)
  - Home goods (mugs, decor)
  - Electronics or other category

**Quality requirements:**
- High-resolution
- Clear before/after transformation
- Diverse product categories
- Mobile-optimized aspect ratios

### Copy Tone
- **Voice:** Friendly, enthusiastic, transparent
- **Avoid:** Corporate jargon, fake scale, overpromising
- **Emphasize:** Speed (30 seconds), ease (no skills needed), value (per-photo pricing)

---

## Technical Considerations

### Stack
- Next.js 16
- shadcn/ui components
- Tailwind v4 (CSS-first via globals.css)
- Mobile-first responsive design

### Component Strategy
- Stick with shadcn components where possible (Button, Card, Badge)
- Custom BeforeAfterSlider component (already exists)
- Scroll-triggered animations (Intersection Observer API)
- Touch-friendly interactions for mobile

### Performance
- Lazy-load scroll reveal images
- Optimize before/after image sizes
- Smooth scroll behavior
- Fast initial paint (hero images prioritized)

### Accessibility
- Semantic HTML structure
- Alt text for all images
- Keyboard navigation for slider
- ARIA labels where needed
- Sufficient color contrast (even in dark mode)

---

## Success Metrics (Post-Launch)

**Primary:**
- Signup conversion rate
- Free trial → paid conversion

**Secondary:**
- Scroll depth (are users seeing full page?)
- CTA click rates (hero vs final CTA)
- Mobile vs desktop behavior

**Qualitative:**
- User feedback on credibility perception
- Clarity of value proposition

---

## Future Iterations

**Phase 2 (after launch data):**
- A/B test: Scroll Story vs Problem/Solution approach
- Add testimonials once available
- Usage statistics ("X photos generated")
- Video/gif of transformation process

**Phase 3 (growth):**
- Case studies from power users
- Industry-specific landing pages
- Interactive demo (if spam risk solved)

---

## Open Questions for Implementation

1. **Animation library:** Use Framer Motion, or vanilla Intersection Observer?
2. **Scroll behavior:** Snap sections, or free scroll?
3. **Gemini logo:** Do we have permission to use? Link to Google AI?
4. **Trust strip icons:** Custom or icon library (Lucide/Heroicons)?
5. **Mobile slider:** Swipe gesture or drag handle?

---

## Design Approval

**Validated with user:** 2025-12-10
**Ready for implementation:** Yes

**Next steps:**
1. Set up git worktree for isolated development
2. Create detailed implementation plan
3. Begin component development
