# Replace globals.css with shadcn-template Structure

## Files to Modify
- `src/app/globals.css` (complete rewrite: 295 lines → ~130 lines)

## Implementation Details

### Objective
Replace ProductPix's custom studio theme with shadcn-template's gray + green design system foundation.

### Key Changes

1. **Add Missing Imports** (lines 1-3):
   ```css
   @import "tailwindcss";
   @import "tw-animate-css";
   @import "shadcn/tailwind.css";  /* CRITICAL: Currently missing */
   ```

2. **Add Custom Variant Declaration**:
   ```css
   @custom-variant dark (&:is(.dark *));
   ```

3. **Add @theme inline with Radius Utilities**:
   ```css
   @theme inline {
     --color-background: var(--background);
     --color-foreground: var(--foreground);
     --font-sans: var(--font-sans);
     --font-mono: var(--font-geist-mono);

     /* Sidebar tokens */
     --color-sidebar-ring: var(--sidebar-ring);
     --color-sidebar-border: var(--sidebar-border);
     --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
     --color-sidebar-accent: var(--sidebar-accent);
     --color-sidebar-primary-foreground: var(--sidebar-primary-foreground);
     --color-sidebar-primary: var(--sidebar-primary);
     --color-sidebar-foreground: var(--sidebar-foreground);
     --color-sidebar: var(--sidebar);

     /* Chart tokens */
     --color-chart-5: var(--chart-5);
     --color-chart-4: var(--chart-4);
     --color-chart-3: var(--chart-3);
     --color-chart-2: var(--chart-2);
     --color-chart-1: var(--chart-1);

     /* Semantic tokens */
     --color-ring: var(--ring);
     --color-input: var(--input);
     --color-border: var(--border);
     --color-destructive: var(--destructive);
     --color-accent-foreground: var(--accent-foreground);
     --color-accent: var(--accent);
     --color-muted-foreground: var(--muted-foreground);
     --color-muted: var(--muted);
     --color-secondary-foreground: var(--secondary-foreground);
     --color-secondary: var(--secondary);
     --color-primary-foreground: var(--primary-foreground);
     --color-primary: var(--primary);
     --color-popover-foreground: var(--popover-foreground);
     --color-popover: var(--popover);
     --color-card-foreground: var(--card-foreground);
     --color-card: var(--card);

     /* Radius utilities - CRITICAL ADDITION */
     --radius-sm: calc(var(--radius) - 4px);
     --radius-md: calc(var(--radius) - 2px);
     --radius-lg: var(--radius);
     --radius-xl: calc(var(--radius) + 4px);
     --radius-2xl: calc(var(--radius) + 8px);
     --radius-3xl: calc(var(--radius) + 12px);
     --radius-4xl: calc(var(--radius) + 16px);
   }
   ```

4. **Replace Color Tokens**:

   **Dark Mode** (most critical):
   ```css
   .dark {
     --background: oklch(0.13 0.028 261.692);        /* Gray, NOT blue charcoal */
     --foreground: oklch(0.985 0.002 247.839);
     --card: oklch(0.21 0.034 264.665);              /* Subtle gray, not blue tint */
     --card-foreground: oklch(0.985 0.002 247.839);
     --popover: oklch(0.21 0.034 264.665);
     --popover-foreground: oklch(0.985 0.002 247.839);
     --primary: oklch(0.648 0.2 131.684);            /* GREEN theme */
     --primary-foreground: oklch(0.986 0.031 120.757);
     --secondary: oklch(0.274 0.006 286.033);
     --secondary-foreground: oklch(0.985 0 0);
     --muted: oklch(0.278 0.033 256.848);
     --muted-foreground: oklch(0.707 0.022 261.325);
     --accent: oklch(0.278 0.033 256.848);
     --accent-foreground: oklch(0.985 0.002 247.839);
     --destructive: oklch(0.704 0.191 22.216);
     --border: oklch(1 0 0 / 10%);
     --input: oklch(1 0 0 / 15%);
     --ring: oklch(0.551 0.027 264.364);
     --chart-1: oklch(0.871 0.15 154.449);
     --chart-2: oklch(0.723 0.219 149.579);
     --chart-3: oklch(0.627 0.194 149.214);
     --chart-4: oklch(0.527 0.154 150.069);
     --chart-5: oklch(0.448 0.119 151.328);
     --sidebar: oklch(0.21 0.034 264.665);
     --sidebar-foreground: oklch(0.985 0.002 247.839);
     --sidebar-primary: oklch(0.768 0.233 130.85);
     --sidebar-primary-foreground: oklch(0.986 0.031 120.757);
     --sidebar-accent: oklch(0.278 0.033 256.848);
     --sidebar-accent-foreground: oklch(0.985 0.002 247.839);
     --sidebar-border: oklch(1 0 0 / 10%);
     --sidebar-ring: oklch(0.551 0.027 264.364);
   }
   ```

   **Light Mode** (:root):
   ```css
   :root {
     --background: oklch(1 0 0);
     --foreground: oklch(0.13 0.028 261.692);
     --card: oklch(1 0 0);
     --card-foreground: oklch(0.13 0.028 261.692);
     --popover: oklch(1 0 0);
     --popover-foreground: oklch(0.13 0.028 261.692);
     --primary: oklch(0.648 0.2 131.684);            /* GREEN theme color */
     --primary-foreground: oklch(0.986 0.031 120.757);
     --secondary: oklch(0.967 0.001 286.375);
     --secondary-foreground: oklch(0.21 0.006 285.885);
     --muted: oklch(0.967 0.003 264.542);
     --muted-foreground: oklch(0.551 0.027 264.364);
     --accent: oklch(0.967 0.003 264.542);
     --accent-foreground: oklch(0.21 0.034 264.665);
     --destructive: oklch(0.577 0.245 27.325);
     --border: oklch(0.928 0.006 264.531);
     --input: oklch(0.928 0.006 264.531);
     --ring: oklch(0.707 0.022 261.325);
     --chart-1: oklch(0.871 0.15 154.449);
     --chart-2: oklch(0.723 0.219 149.579);
     --chart-3: oklch(0.627 0.194 149.214);
     --chart-4: oklch(0.527 0.154 150.069);
     --chart-5: oklch(0.448 0.119 151.328);
     --radius: 0.625rem;
     --sidebar: oklch(0.985 0.002 247.839);
     --sidebar-foreground: oklch(0.13 0.028 261.692);
     --sidebar-primary: oklch(0.648 0.2 131.684);
     --sidebar-primary-foreground: oklch(0.986 0.031 120.757);
     --sidebar-accent: oklch(0.967 0.003 264.542);
     --sidebar-accent-foreground: oklch(0.21 0.034 264.665);
     --sidebar-border: oklch(0.928 0.006 264.531);
     --sidebar-ring: oklch(0.707 0.022 261.325);
   }
   ```

5. **Remove 130+ Lines of Custom Studio Effects**:
   - Typography customizations (h1-h6, body, code) - now handled by layout.tsx
   - `.studio-spotlight` (radial gradient lighting)
   - `.studio-gradient-bg`
   - `.matte-card` and `.matte-card-hover` (gradient backgrounds with box-shadow)
   - `.soft-glow-text`
   - `.gradient-text-studio` (text gradients)
   - `@keyframes subtle-shine` and `.button-studio` (button animations)
   - `.ambient-wash`, `.ambient-wash-green`, `.ambient-wash-teal` (blurred overlays)
   - `.section-divider`
   - `.hover-lift`
   - All teal/accent utility classes: `.text-accent`, `.bg-accent-subtle`, `.border-accent`, `.text-teal`, `.bg-teal`, `.bg-teal-subtle`, `.border-teal`

6. **Add Minimal @layer base**:
   ```css
   @layer base {
     * {
       @apply border-border outline-ring/50;
     }
     body {
       @apply bg-background text-foreground;
     }
   }
   ```

### Tokens Being Removed
- `--teal`, `--teal-foreground`
- `--card-hero`, `--card-control`
- Custom `--accent` (replaced by `--primary`)
- Custom `--success`, `--info`

## Reference
Copy structure exactly from: `/home/kevin/coding/shadcn-template/app/globals.css`

## Acceptance Criteria
- [ ] File reduced from 295 lines to ~130 lines
- [ ] `@import "shadcn/tailwind.css"` present
- [ ] `@theme inline` block with radius utilities present
- [ ] All color tokens match shadcn-template exactly
- [ ] All custom studio effects removed
- [ ] `bun run build` succeeds with no CSS errors
- [ ] Dark mode toggle still works

## Dependencies
None - this is the foundation task

## Validation Command
```bash
bun run build
```

## Rollback Checkpoint
After this task, test build. If it fails, this is the rollback point.
