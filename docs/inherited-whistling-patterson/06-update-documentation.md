# Update Documentation Files

## Files to Modify
- `CLAUDE.md` (modify line ~119)
- `docs/design-system.md` (modify multiple sections)
- `docs/design-principles.md` (review and update)

## Implementation Details

### 6.1 CLAUDE.md Updates

**File**: `CLAUDE.md`

**Line ~119** (UI/UX Patterns section):

**REMOVE**:
```md
**Brand**: Clean, minimal, inviting, playful — NOT dev-tool/crypto aesthetic
**Colors**: Green (primary CTA), Teal (secondary/info)
**Typography**: Space Grotesk (display), Inter (body), mono (meta only)
**Heuristic**: If it looks like terminal/dashboard → wrong
```

**REPLACE WITH**:
```md
**Brand**: Clean, minimal, shadcn design system
**Colors**: Green (primary/accent), Gray (neutral base)
**Typography**: Figtree (display), Geist (body), Geist Mono (code)
**Design System**: shadcn/ui with gray + green theme
```

---

### 6.2 docs/design-system.md Updates

**File**: `docs/design-system.md`

#### Update 1: Color Token Table

**Find and remove** these tokens from any color reference tables:
- `--teal` / `--teal-foreground`
- `--card-hero`
- `--card-control`
- Custom `--accent` (replaced by `--primary`)
- Custom `--success` / `--info`

**Add note** about primary token:
```md
**Note**: `--primary` is the green theme color. The old `--accent` token has been replaced by `--primary` to align with shadcn-template standards.
```

#### Update 2: Button Variants Section

**Remove** these variants from documentation:
- `studio` - Removed (used custom button-studio animation)

**Update** description of `accent`:
```md
**accent**: Uses primary green color (alias for `default` with primary colors)
```

#### Update 3: Badge Variants Section

**Remove** these variants:
- `teal` - Removed (used deleted `--teal` token)
- `success` - Removed (use `default` for green)
- `info` - Removed (use `secondary` for informational)

**Keep only**:
- `default`
- `secondary`
- `destructive`
- `outline`

#### Update 4: Remove Studio Effects Section

**Find and delete** entire section about studio effects (if exists), including:
- `.studio-spotlight` documentation
- `.matte-card` documentation
- `.gradient-text-studio` documentation
- `.ambient-wash` documentation
- Any custom animation documentation

#### Update 5: Add shadcn-template Reference

**Add section** at the top:
```md
## Design System Source

This project uses [shadcn/ui](https://ui.shadcn.com/) design system with:
- **Base color**: Gray (nearly neutral, low chroma)
- **Theme color**: Green (primary accent)
- **Structure**: @theme inline with radius utilities
- **Imports**: Requires `@import "shadcn/tailwind.css"`
```

---

### 6.3 docs/design-principles.md Updates

**File**: `docs/design-principles.md`

#### Review for These Topics:

1. **References to "studio aesthetic"**
   - Replace with "shadcn minimal design"
   - Emphasize clean, accessible patterns

2. **Teal as secondary brand color**
   - Remove all references to teal
   - Update to: "Green primary with gray neutral base"

3. **Custom effects philosophy**
   - Remove justifications for studio lighting effects
   - Replace with shadcn design philosophy:
     - Semantic tokens over hardcoded values
     - Accessibility-first
     - Clean, minimal, functional

4. **Typography section** (if exists)
   - Confirm: Figtree (display), Geist (body), Geist Mono (code)
   - Remove any references to Space Grotesk or Inter

#### Add New Principles Section

**Add** (if not already present):
```md
## Design System Principles

### Semantic Tokens First
- Always use CSS custom properties (e.g., `var(--primary)`)
- Never hardcode color values or use Tailwind arbitrary values for colors
- Ensures theme switching works correctly

### Component Composition
- Build with shadcn/ui primitives
- Prefer composition over custom styling
- Keep components accessible and semantic

### Minimal Custom CSS
- Rely on Tailwind utilities
- Custom CSS only when necessary
- No custom animations or effects that bypass theme system

### Responsive by Default
- Mobile-first approach
- Use Tailwind breakpoints (sm, md, lg, xl)
- Test on multiple viewport sizes
```

## Acceptance Criteria

**CLAUDE.md**:
- [ ] Colors updated to "Green (primary/accent), Gray (neutral base)"
- [ ] Typography updated to Figtree/Geist/Geist Mono
- [ ] No references to removed tokens or variants

**docs/design-system.md**:
- [ ] Removed tokens deleted from color tables
- [ ] Button variants updated (no `studio`)
- [ ] Badge variants updated (no `teal`, `success`, `info`)
- [ ] Studio effects section removed
- [ ] shadcn-template reference added

**docs/design-principles.md**:
- [ ] No references to "studio aesthetic"
- [ ] No references to teal as brand color
- [ ] Updated design philosophy section
- [ ] Semantic tokens principle documented

**Overall**:
- [ ] Documentation accurately reflects new design system
- [ ] No outdated variant references
- [ ] Principles align with shadcn/ui philosophy

## Dependencies
- Depends on: All previous tasks (documents the final state)

## Validation Commands
```bash
# Search for outdated references
grep -i "teal" CLAUDE.md docs/design-system.md docs/design-principles.md
grep -i "studio aesthetic" docs/design-principles.md
grep -i "space grotesk" CLAUDE.md docs/
grep -i "variant.*studio" docs/design-system.md

# Should return no results (except in historical context)
```

## Notes
- Documentation updates are non-breaking
- Can be done last after all code changes verified
- Important for team alignment and future development
- Ensures new developers understand current design system

## Rollback Checkpoint
Documentation changes are low-risk and easily reverted if needed.
