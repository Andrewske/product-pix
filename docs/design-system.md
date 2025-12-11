# ProductPix Design Principles (High‑Level Guide)

Give this to anyone designing/implementing UI so they understand the *why*,
not just the components.

---

## 1. Brand & Feel

- **Who:** ecommerce sellers, resellers, dropshippers.
- **Vibe:** clean, minimal, inviting, a bit playful — *not* dev‑tool or crypto.
- **Promise:** “Studio‑quality photos that help your listings sell more.”

**Heuristic**  
If it looks like a terminal, analytics dashboard, or video game UI, it’s off.

---

## 2. Color Strategy

### Neutrals First

- Light mode is the mental default: soft gray page background, white cards.
- Dark mode mirrors the same structure with charcoal backgrounds and lighter cards.
- Product photos should always sit on **clear, light surfaces** so they feel shoppable.

### Accent Usage

We use **two accents with clear meanings**:

- **Primary accent = Green**
  - Primary buttons and key CTAs
  - Selected “main” options (e.g., chosen style / aspect ratio)
  - Credit / “Generate” actions

- **Secondary accent = Teal**
  - Small pills and badges (e.g., “AI studio for ecommerce sellers”)
  - Informational highlights (icons, tips, helper text)
  - Light nav highlighting or status indicators

**Rules**

- One strong accent per component: usually **green**, with small teal details allowed.
- Green expresses “do / commit / spend a credit.”
- Teal expresses “info / context / support.”
- No full‑screen bright green/teal backgrounds. Backgrounds are quiet; photos and CTAs supply the color.

---

## 3. Typography Decisions

- **Display font:** modern, friendly sans (e.g., Space Grotesk).
- **Body font:** clean sans (e.g., Inter).
- **Mono:** only for tiny meta (credit prices, timestamps) — never for headings or nav.

**Hierarchy**

- Big, confident page titles (H1) like “Generate Product Photo.”
- Section labels (“Upload product image”, “Choose style”) are smaller and more muted.
- Body text is 15–16px with relaxed line height.

**Heuristic**  
If the page looks like a code editor or terminal, you’re using the wrong font or hierarchy.

---

## 4. Layout & Structure

- **Generous whitespace.** Fewer elements, spaced out more.
- **Card‑based layout:** Most content lives in white cards on a softer page background.
- **Two‑column app pattern:**
  - **Left:** controls / settings in a single stacked card.
  - **Right:** primary content (product photo, result, gallery) in a larger “hero” card.
- On mobile, columns stack; the primary content still appears visually dominant.

**Priority**  
The product photo is the hero. Controls are important, but they should visually support the photo/result, not compete with it.

---

## 5. Imagery & Story

- Highlight **before → after** whenever possible, especially on marketing pages.
- Generated photos live on **light, neutral surfaces**, even in dark mode.
- Copy should tie visuals to outcomes:
  - “Turn phone snapshots into studio‑quality photos.”
  - “Make your listings look professionally shot.”

**Heuristic**  
If you hide the photos and the page still feels loud, the UI is too busy.

---

## 6. Interaction & Motion

- Transitions are **smooth but restrained** (around 150–250ms).
- Hover states:
  - Slight elevation and clearer borders for cards.
  - Subtle color shift for buttons (no big scaling).
- Animations should communicate state (loading, success), not exist for decoration.

**Avoid**

- Repeating animations with no functional meaning.
- Glossy or overly glassy effects; the feel is matte and calm.

---

## 7. Tone & Microcopy

- Clear, short, and seller‑focused.
- Emphasize **outcomes**, not AI magic:
  - “Sell more with studio‑quality photos.”
  - “Stand out from other sellers using the same product.”
- Empty states and tips are practical and encouraging, not snarky.

**Heuristic**  
If the sentence could be on any generic AI tool, rewrite it to mention listings, photos, or marketplaces.

---

## 8. Consistency Rules

- Same spacing rhythm between sections across pages.
- Consistent heading sizes for:
  - Page titles
  - Section titles
  - Card titles
- Same accent rules everywhere:
  - **Green = main action / selection**
  - **Teal = supporting info / badges**
- Same shape language:
  - Rounded corners on cards, buttons, and images are **soft but not bubbly**.

---

### Quick Sanity Check Before Shipping

1. Does the page immediately communicate *product photos* and *selling more*?
2. Do products sit on clear, light surfaces?
3. Is green reserved for the most important actions/selections?
4. Is teal used only for secondary info and small highlights?
5. Are headings in a modern sans (not mono) with obvious hierarchy?
6. Does the layout feel simple enough that a non‑technical seller won’t be intimidated?

If these are all yes, you’re aligned with the ProductPix design principles.


## Dark Mode Principles (Addendum)

Dark mode should feel like a calm photo studio at night — **layered charcoal**, not
pure black.

### 1. Background & Surfaces

- **No pure black.** Use deep charcoal for the page background:
  - Example: `#05070b` or similar ink‑like tone.
- Cards/panels are **one step lighter** than the background:
  - Example: `#0b1018`–`#111827`.
- Always use a subtle border to define edges:
  - `rgba(255,255,255,0.06–0.08)`.

### 2. Hierarchy in the Dark

- The **result panel** should be the lightest major surface so it still reads
  as the hero (slightly lighter card than the controls).
- Avoid large areas of flat, undifferentiated black; every major region should
  be a card or surface sitting on the charcoal base.

### 3. Product Area

- Keep product photos on a clearly defined surface:
  - Dark neutral canvas inside the card (not full black), with a subtle border
    or rim so images don’t “bleed” into the background.
- The user should always be able to visually separate:
  - page background → card → image area.

### 4. Accent Behavior

- Same meaning as light mode:
  - **Green = primary action / selection**
  - **Teal = secondary info / badges**
- Because dark backgrounds make colors pop more:
  - Prefer **smaller** accent areas (borders, icons, pills) rather than large
    filled blocks of color.
- Don’t introduce extra neon glows; keep the feel matte and controlled.

**Dark‑mode sanity check**

- Is there almost no pure `#000` on screen?
- Can you clearly see layers: background vs cards vs image area?
- Does the result/photo card read as the most important surface?
- Are green/teal still the only bright colors?

If yes, dark mode is aligned with ProductPix principles.