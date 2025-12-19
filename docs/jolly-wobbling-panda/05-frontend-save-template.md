# Frontend: Save Template UI

## Files to Modify/Create
- `prompt-bench/ui/components/notebook/GenerationPhase.tsx` (modify)

## Implementation Details

Add template saving UI with version display and save button in the Advanced Configuration section.

### State Additions

Add new state variables:
```typescript
const [currentTemplateVersion, setCurrentTemplateVersion] = useState<number | null>(null);
const [isSaving, setIsSaving] = useState(false);
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
```

### Fetch Current Version on Template Selection

Add effect to load version when template changes:
```typescript
React.useEffect(() => {
  if (templateSlug) {
    const template = templates.find((t) => t.slug === templateSlug);
    if (template) {
      // Warn if switching templates with unsaved changes
      if (hasUnsavedChanges) {
        const confirmed = window.confirm(
          'You have unsaved changes. Switching templates will lose your edits. Continue?'
        );
        if (!confirmed) return;
      }

      setTemplateData(template.template_data || {});
      setCurrentTemplateVersion(template.version || null);
      setHasUnsavedChanges(false);
    }
  }
}, [templateSlug, templates, hasUnsavedChanges]);
```

Add effect to track template data changes:
```typescript
React.useEffect(() => {
  if (templateSlug) {
    const template = templates.find((t) => t.slug === templateSlug);
    const originalData = template?.template_data || {};
    const hasChanges = JSON.stringify(templateData) !== JSON.stringify(originalData);
    setHasUnsavedChanges(hasChanges);
  }
}, [templateData, templateSlug, templates]);
```

### Add Save Handler

```typescript
const handleSaveTemplate = async () => {
  if (!templateSlug || !templateData) {
    setError('Cannot save: missing template slug or data');
    return;
  }

  setIsSaving(true);

  try {
    const res = await fetch('/api/notebook/save-template', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: templateSlug,
        templateData,
        variablesSchema: templates.find(t => t.slug === templateSlug)?.variables_schema,
        outputCount: generationConfig.numberOfImages  // Backend auto-detects type from this
      }),
    });

    const result = await res.json();

    if (result.error) {
      setError(`Save failed: ${result.error}`);
    } else {
      setCurrentTemplateVersion(result.template.version);
      setHasUnsavedChanges(false);
      // Optionally: show success toast or message
      console.log(result.message); // "Saved template-slug v4"
    }
  } catch (err) {
    setError(`Save failed: ${(err as Error).message}`);
  } finally {
    setIsSaving(false);
  }
};
```

### Add Save Button in Advanced Configuration

Update the button row in Advanced Configuration accordion:
```tsx
<div className="flex gap-2 justify-end pt-2">
  <Button variant="outline" size="sm" onClick={previewPrompt} className="h-8">
    Preview Compiled Prompt
  </Button>
  <Button
    variant="default"
    size="sm"
    onClick={handleSaveTemplate}
    disabled={isSaving || !templateSlug}
    className="h-8"
  >
    {isSaving ? 'Saving...' : `Save as v${(currentTemplateVersion || 0) + 1}`}
  </Button>
</div>
```

### Add Version Badge in Header

Add version badge next to "Generation Phase" title:
```tsx
<CardTitle className="flex items-center gap-2 text-xl">
  <Wand2 className="h-5 w-5 text-purple-500" />
  Generation Phase
  {currentTemplateVersion && (
    <Badge variant="secondary" className="text-xs">
      v{currentTemplateVersion}
    </Badge>
  )}
</CardTitle>
```

### Required Import

Add Badge import if not already present:
```typescript
import { Badge } from '../../shadcn';
```

## Acceptance Criteria

- [ ] State variables added for version and saving status
- [ ] Effect loads current version when template changes
- [ ] Save handler validates required fields
- [ ] Save handler calls `/api/notebook/save-template` endpoint
- [ ] Save button displays "Save as v{N}" with next version
- [ ] Save button disabled while saving or no template selected
- [ ] Version badge displays in header when template loaded
- [ ] Success message displayed after save
- [ ] Error message displayed on save failure
- [ ] Template version updates in UI after successful save

## Dependencies

- **Task 04** - Requires `/api/notebook/save-template` endpoint to exist
