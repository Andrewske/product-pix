# Future Implementation Decisions

Decisions made during brainstorming for the full multi-image feature. Reference this when implementing the production feature after experiments validate the approach.

---

## Core Feature Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Input count** | 1-5 images | Balance flexibility and complexity |
| **Output count** | User selects (1-10?) | AI decides variety within that count |
| **Generation approach** | Per-output calls, all inputs as context | More predictable than single batch call |
| **Variety strategy** | TBD by experiments | Testing hardcoded vs AI-decided vs hybrid |
| **Pricing** | 1 credit per output | Simple, adjustable later based on cost data |

## UX Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **UI approach** | Progressive enhancement | Add "more images" + "output count" to existing flow, backwards compatible |
| **Results display** | Sequential reveal + collection grouping | Show progress as each completes, group as collection in library |
| **User control** | Just pick output count | User says "give me 5" and AI decides variety (simplest UX) |

## Data Model Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Collection entity** | New table linking generated_images | 1 job → 1 collection → N images |
| **Job relationship** | 1:1 job to collection | Collection is the unit of work |

## Open Questions (Decide Later)

- **Max output count** — 5? 10? Depends on cost/quality tradeoff
- **Collection naming** — Should collections have user-defined names/labels?
- **ZIP download** — Offer "download all as ZIP" option?
- **Partial regeneration** — Can user re-generate single image within collection?
- **Template selection** — One template per collection, or mix templates?

## Technical Considerations

### Generation Flow
```
User uploads 1-5 images
  → User selects output count (1-10)
  → For each output:
      → Send ALL input images to Gemini as context
      → Generate with variety prompt (strategy TBD by experiments)
      → Save to collection
  → Show results as they complete
  → Group in library as collection
```

### API Changes Needed
- `POST /api/generate` → support `sourceImages: string[]` (array)
- `POST /api/generate` → support `outputCount: number`
- Response → return `collectionId` + array of `imageIds`

### Database Changes Needed
- New `collections` table:
  ```sql
  collections (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users,
    job_id UUID REFERENCES jobs,
    name TEXT,
    created_at TIMESTAMPTZ
  )
  ```
- Add `collection_id` to `generated_images` table
- Or: use `job_id` as the grouping key (simpler, no new table)

### UI Changes Needed
- Upload component: support multiple file selection
- Generation form: add output count selector
- Results view: show progress per-image, group as collection
- Library: display collections as expandable groups

---

## Reference

This document captures decisions from the brainstorming session. The experiment tasks (01-06) will validate the prompting approach. Once experiments complete, use these decisions to plan the full implementation.

**Related files:**
- Original plan: `.claude/plans/joyful-splashing-flame.md`
- Experiment results: `docs/joyful-splashing-flame/results/` (after experiments)
