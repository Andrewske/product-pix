# ProductPix Design Principles

> The "why" behind our design decisions. For implementation details (tokens, components, code), see [Design System](./design-system.md).

**Last updated:** 2025-12-12

---

## Purpose

This document is for anyone designing or implementing UI—it explains the *why*, not the *how*. Read this to understand our brand, make design decisions, and evaluate whether new work aligns with ProductPix identity.

---

## 1. Brand Identity

### Who We Serve
Ecommerce sellers, resellers, and dropshippers who need professional product photos without professional photography skills or budgets.

### Our Vibe
**Clean, minimal, inviting, and slightly playful.**

We are a friendly tool that makes sellers feel capable, not intimidated. Our interface should feel like a helpful assistant, not a complex dashboard.

### Brand Promise
*"Studio-quality photos that help your listings sell more."*

### What We Are NOT

| Anti-pattern | Why to avoid |
|--------------|--------------|
| **Terminal/Dev Tool** | Monospace fonts, data-dense layouts, stark monochromatic schemes alienate non-technical sellers |
| **Crypto/DeFi** | Harsh neon colors, blockchain aesthetics, aggressive marketing feel untrustworthy |
| **Enterprise SaaS** | Complex navigation, feature-heavy interfaces overwhelm small sellers |
| **Video Game UI** | Flashy animations, gamification elements distract from the product photos |

### Core Heuristic
> **"If it looks like a terminal, analytics dashboard, or video game UI, it's wrong."**

---

## 2. Color Philosophy

### Neutrals First
- **Light mode** is the mental default: soft gray page background, white cards
- **Dark mode** mirrors the same structure with layered charcoal backgrounds
- Product photos always sit on **clear, defined surfaces** so they feel shoppable

### Two-Accent Strategy

We use exactly two accent colors with distinct semantic meanings:

| Accent | Meaning | Use Cases |
|--------|---------|-----------|
| **Green** | Action, commitment, spending credits | Primary CTAs, "Generate" button, selected options, confirmations |
| **Teal** | Information, context, support | Badges, helper text, status indicators, tips |

### Accent Rules
1. **One strong accent per component**—usually green, with small teal details allowed
2. **Green = "do / commit / spend a credit"**
3. **Teal = "info / context / support"**
4. **No full-screen bright backgrounds**—backgrounds are quiet; photos and CTAs supply the color

### Why OKLCH?
We use OKLCH color space in CSS for perceptually uniform colors. This means:
- Colors look consistently bright/saturated across the spectrum
- Dark mode adjustments are predictable
- Accessibility calculations are more accurate

---

## 3. Typography Philosophy

### Font Choices

| Role | Font | Rationale |
|------|------|-----------|
| **Display** | Space Grotesk | Modern, friendly, slightly playful—matches our brand |
| **Body** | Inter | Clean, highly readable, professional |
| **Mono** | System mono | Only for tiny metadata (prices, timestamps)—never UI text |

### Hierarchy Principles
- **H1 (Page titles)**: Big, confident. "Generate Product Photo"
- **Section labels**: Smaller, more muted. "Upload product image"
- **Body text**: 15-16px with relaxed line height for comfortable reading

### Typography Heuristic
> **"If the page looks like a code editor or terminal, you're using the wrong font or hierarchy."**

---

## 4. Layout Philosophy

### Whitespace
**Generous.** Fewer elements, spaced out more. When in doubt, add breathing room.

### Card-Based Structure
Most content lives in cards on a softer page background. Cards create visual grouping and hierarchy without heavy borders.

### Two-Column Pattern
Our primary app layout:
- **Left column**: Controls, settings, inputs (in a single stacked card)
- **Right column**: Hero content—product photos, results, previews (larger, more prominent card)

On mobile, columns stack with the hero content remaining visually dominant.

### Layout Priority
> **The product photo is the hero.** Controls support the photo—they should never compete with it.

---

## 5. Imagery & Story

### Before → After
Highlight transformation whenever possible, especially on marketing pages. Show the value of what we do.

### Photo Presentation
- Generated photos live on **light, neutral surfaces**, even in dark mode
- Users should always see clear separation: page → card → image area

### Copy Principles
Tie visuals to outcomes—what the seller will achieve:
- "Turn phone snapshots into studio-quality photos"
- "Make your listings look professionally shot"
- "Stand out from other sellers using the same product"

### Imagery Heuristic
> **"If you hide the photos and the page still feels loud, the UI is too busy."**

---

## 6. Motion Philosophy

### Timing
- **Standard transitions**: 150-250ms for state changes
- **Hover states**: Slight elevation, clearer borders, subtle color shifts
- **No big scaling** on hover—keep it restrained

### Purpose Over Decoration
Animations should **communicate state** (loading, success, error), not exist for their own sake.

### What to Avoid
- Repeating animations with no functional meaning
- Glossy or overly glassy effects
- Neon glows or harsh lighting effects

### Motion Principle
> **The feel is matte and calm.** We want a professional studio, not a nightclub.

---

## 7. Tone & Microcopy

### Voice
Clear, short, and seller-focused. We're helpful, not clever.

### Outcome-Focused
Emphasize what sellers achieve, not AI capabilities:
- "Sell more with studio-quality photos" (outcome)
- NOT "Our AI generates photorealistic backgrounds" (feature)

### Empty States & Tips
Practical and encouraging, never snarky or dismissive.

### Microcopy Heuristic
> **"If the sentence could be on any generic AI tool, rewrite it to mention listings, photos, or marketplaces."**

---

## 8. Dark Mode Philosophy

Dark mode should feel like **a calm photo studio at night**—layered charcoal, not pure black.

### Surface Hierarchy
1. **Page background**: Deep charcoal (never pure black)
2. **Cards/panels**: One step lighter than background
3. **Hero cards**: Slightly lighter than control cards (result panel is most prominent)
4. **Borders**: Subtle white borders define edges

### Visual Separation
Users should always clearly see three layers:
- Page background → Card → Image area

### Accent Behavior in Dark Mode
- Same meanings as light mode (green = action, teal = info)
- **Smaller accent areas** preferred—dark backgrounds make colors pop more
- No extra neon glows; keep the matte, controlled feel

---

## Sanity Checks

### Before Shipping (Light or Dark Mode)

- [ ] Does the page immediately communicate *product photos* and *selling more*?
- [ ] Do products sit on clear, defined surfaces?
- [ ] Is green reserved for the most important actions/selections?
- [ ] Is teal used only for secondary info and small highlights?
- [ ] Are headings in a modern sans (not mono) with obvious hierarchy?
- [ ] Does the layout feel simple enough that a non-technical seller won't be intimidated?

### Dark Mode Specific

- [ ] Is there almost no pure black (`#000`) on screen?
- [ ] Can you clearly see layers: background vs cards vs image area?
- [ ] Does the result/photo card read as the most important surface?
- [ ] Are green/teal still the only bright colors (no neon additions)?

---

## Decision Log

*Record major design decisions here with rationale. For historical context on past decisions, see completed implementation plans in `docs/done/design-system-*.md`.*

| Date | Decision | Rationale | Alternatives Considered |
|------|----------|-----------|------------------------|
| *Add entries as decisions are made* | | | |

---

## Related Documents

- [Design System](./design-system.md) — Implementation reference (tokens, components, code examples)
- [docs/done/design-system-*.md](./done/) — Historical implementation plans
