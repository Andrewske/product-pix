# Help Search → Command Component Migration

## Files to Modify/Create
- `src/components/help/help-search.tsx` (modify)

## Implementation Details

**Current State:** Custom search dropdown with manual keyboard navigation:
```tsx
const handleKeyDown = (event: React.KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowDown': ...
    case 'ArrowUp': ...
```

**Migration:**
Replace with shadcn Command component (based on cmdk):

```tsx
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

// For inline search (not dialog):
<Command className="rounded-lg border shadow-md">
  <CommandInput placeholder="Search help articles..." />
  <CommandList>
    <CommandEmpty>No results found.</CommandEmpty>
    <CommandGroup heading="Articles">
      {filteredArticles.map((article) => (
        <CommandItem
          key={article.id}
          value={article.title}
          onSelect={() => handleArticleSelect(article)}
        >
          {article.title}
        </CommandItem>
      ))}
    </CommandGroup>
  </CommandList>
</Command>

// OR for modal/dialog search (Cmd+K pattern):
const [open, setOpen] = useState(false);

<CommandDialog open={open} onOpenChange={setOpen}>
  <CommandInput placeholder="Search help..." />
  <CommandList>
    {/* Same content structure */}
  </CommandList>
</CommandDialog>
```

**Key Benefits:**
- Built-in fuzzy search (cmdk handles filtering)
- Keyboard navigation automatic (↑↓ to navigate, Enter to select)
- Accessibility handled (proper ARIA attributes)
- Consistent styling with other shadcn components

## Acceptance Criteria
- [ ] Search input integrated with Command component
- [ ] Results display in CommandList with proper grouping
- [ ] Arrow key navigation works (up/down to navigate items)
- [ ] Enter key selects item
- [ ] Empty state displays when no results
- [ ] Escape closes dropdown/dialog
- [ ] Visual styling matches app design system
- [ ] Existing search functionality preserved

## Dependencies
- Tasks 01-05 (lower priority task, do after core migrations)
