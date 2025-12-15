# Fix Supabase Dependency Resolution

## Files to Modify
- `package.json` (modify)

## Implementation Details

**Problem:** @supabase/ssr@0.8.0 peer dependency pulls in @supabase/supabase-js@2.86.2 via pnpm, while package.json specifies 2.87.1. TypeScript sees two incompatible `SupabaseClient` class types, causing errors in client.ts and server.ts.

**Solution:** Force Bun to use 2.87.1 everywhere via resolutions override.

### Changes Required

Add resolutions field to `package.json`:

```json
{
  "resolutions": {
    "@supabase/supabase-js": "2.87.1"
  }
}
```

Place this field at the root level of the package.json object (alongside "dependencies", "devDependencies", etc).

### Command to Run

```bash
bun install
```

This will force all packages (including @supabase/ssr) to use the specified version.

## Acceptance Criteria

1. **Version Check:**
   ```bash
   ls -la node_modules/@supabase/supabase-js/package.json | xargs cat | grep version
   # Expected output: "version": "2.87.1"
   ```

2. **TypeScript Error Check:**
   ```bash
   bunx tsc --noEmit 2>&1 | grep supabaseUrl
   # Expected: 0 matches (no errors about supabaseUrl property)
   ```

3. **Affected Files Should Compile:**
   - `src/lib/supabase/client.ts:13` - No type error
   - `src/lib/supabase/server.ts:16` - No type error

## Dependencies

None - this is the foundational task that must run first.

## Impact

**Fixes:** 2 TypeScript errors related to Supabase client type incompatibility.
