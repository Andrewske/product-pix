# Foundation: Fonts and Theme Setup

## Files to Modify
- `src/app/layout.tsx` (modify)
- `src/app/globals.css` (modify)

## Reference Files
- `/home/kevin/coding/shadcn-template/app/layout.tsx`
- `/home/kevin/coding/shadcn-template/app/globals.css`

## Implementation Details

### layout.tsx Changes

Replace font imports and variable names:

```tsx
// FROM
import { Space_Grotesk, Inter } from "next/font/google";
const fontDisplay = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });
const fontBody = Inter({ subsets: ["latin"], variable: "--font-body" });

// TO
import { Figtree, Geist, Geist_Mono } from "next/font/google";
const fontDisplay = Figtree({ subsets: ["latin"], variable: "--font-display" });
const fontSans = Geist({ subsets: ["latin"], variable: "--font-sans" });
const fontMono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono" });
```

Update body className:
```tsx
<body className={`${fontDisplay.variable} ${fontSans.variable} ${fontMono.variable} font-sans antialiased`}>
```

### globals.css Changes

1. **Add @theme inline block** after imports, before `:root`:
   - Copy from template (colors + radius only)
   - NO font mappings needed

2. **Update :root**:
   - Change `--radius: 0.5rem` → `--radius: 0.625rem`

3. **Update .dark**:
   - Change `--border: oklch(0.2 0.01 265)` → `--border: oklch(1 0 0 / 10%)`
   - Change `--input: oklch(0.2 0.01 265)` → `--input: oklch(1 0 0 / 15%)`

4. **Add @layer base block** at end (copy from template)

5. **Update typography section**:
   - Change `var(--font-body)` → `var(--font-sans)` (2 places)

6. **Keep ProductPix tokens**: `--teal`, `--success`, `--info`, `--card-hero`, `--card-control`

7. **Keep studio animations**: button-studio, matte-card, etc. (may remove later)

## Acceptance Criteria
- [ ] Figtree renders on headings (check h1, h2 on landing page)
- [ ] Geist renders on body text
- [ ] Geist Mono available for code blocks
- [ ] Dark mode borders are subtle (white alpha, not solid)
- [ ] No console errors
- [ ] `bun dev` runs without errors

## Dependencies
None - this is the foundation task

## Checkpoint
**STOP after this task and visually verify before proceeding to Phase 2.**
