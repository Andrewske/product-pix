# Documentation Updates

## Files to Modify
- `docs/design-principles.md` (modify)
- `docs/design-system.md` (modify)
- `CLAUDE.md` (modify)

## Implementation Details

### design-principles.md
Update typography table:
```markdown
| Role | Font | Rationale |
|------|------|-----------|
| **Display** | Figtree | Modern, friendly, slightly playful—matches brand |
| **Body** | Geist | Clean, highly readable, professional |
| **Mono** | Geist Mono | Code blocks and technical content |
```

### design-system.md
- Update font references: Space Grotesk → Figtree, Inter → Geist
- Add radius system documentation:
  - Base radius: 0.625rem (10px)
  - `rounded-4xl`: Pill shapes (buttons, inputs, badges)
  - `rounded-2xl`: Containers (dialogs, cards, popovers)
  - `rounded-xl`: Items (menu items, textarea)
- Document dark mode border approach (white alpha)

### CLAUDE.md
Update UI/UX Patterns section:
```markdown
**Typography**: Figtree (display), Geist (body), Geist Mono (code)
```

## Acceptance Criteria
- [ ] design-principles.md reflects new fonts
- [ ] design-system.md reflects new fonts and radius system
- [ ] CLAUDE.md reflects new fonts
- [ ] Documentation is consistent across all files

## Dependencies
- All component tasks (01-04) should be completed first
