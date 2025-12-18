# Fixture Image Sync Command

## Files to Modify
- `prompt-bench/commands/sync.ts` (modify)

## Implementation Details

Extend the existing `bun bench sync` command to upload fixture images from the local filesystem to R2 and database.

### Steps

**1. Add imports at top of sync.ts**

After line 4 (existing imports), add:

```typescript
import { readdir } from 'node:fs/promises';
import { join, relative, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
```

**2. Add helper functions before syncCommand**

Insert before `export const syncCommand` function (around line 20):

```typescript
/**
 * Extract product name from filepath
 * "bag/front.jpg" → "bag"
 * "coffee-grinder.jpg" → "coffee-grinder"
 */
const extractProductName = (filepath: string): string => {
  const parts = filepath.split('/');
  if (parts.length > 1) {
    return parts[0];
  }
  return basename(filepath, extname(filepath));
};

/**
 * Recursively find all image files in directory
 */
const findImageFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        files.push(...await findImageFiles(fullPath));
      } else if (/\.(jpg|jpeg|png|webp)$/i.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // Directory doesn't exist - return empty array
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return files;
};

/**
 * Sync fixture images from local filesystem to R2 and database
 */
const syncFixtureImages = async (supabase: ReturnType<typeof createAdminClient>): Promise<Result<{ synced: number; skipped: number }>> => {
  const fixturesDir = join(process.cwd(), 'prompt-bench/fixtures/images');

  const imageFiles = await findImageFiles(fixturesDir);

  if (imageFiles.length === 0) {
    logger.info('No fixture images found', { directory: fixturesDir });
    return ok({ synced: 0, skipped: 0 });
  }

  let synced = 0;
  let skipped = 0;

  for (const filePath of imageFiles) {
    const relativePath = relative(fixturesDir, filePath);
    const product = extractProductName(relativePath);
    const filename = basename(filePath);

    // Check if already synced (by filepath)
    const { data: existing } = await supabase
      .from('fixture_images')
      .select('id')
      .eq('filepath', relativePath)
      .single();

    if (existing) {
      logger.debug('Skipping existing fixture', { filepath: relativePath });
      skipped++;
      continue;
    }

    // Read file and generate hash
    const buffer = await Bun.file(filePath).arrayBuffer();
    const hash = createHash('sha256')
      .update(Buffer.from(buffer))
      .digest('hex')
      .slice(0, 8);

    // Upload to R2
    const ext = extname(filename);
    const baseFilename = basename(filename, ext);
    const r2Key = `fixtures/${product}-${baseFilename}-${hash}${ext}`;

    const uploadResult = await uploadBuffer(
      Buffer.from(buffer),
      r2Key,
      'image/jpeg'
    );

    if (!isOk(uploadResult)) {
      logger.error('Failed to upload fixture to R2', {
        filepath: relativePath,
        error: uploadResult.error.message
      });
      continue;
    }

    const r2Url = getPublicUrl(uploadResult.data.key);

    // Insert into database
    const { error: insertError } = await supabase
      .from('fixture_images')
      .insert({
        product,
        filename,
        filepath: relativePath,
        r2_url: r2Url,
        r2_key: uploadResult.data.key
      });

    if (insertError) {
      logger.error('Failed to save fixture to database', {
        filepath: relativePath,
        error: insertError.message
      });
      continue;
    }

    logger.info('Synced fixture image', {
      filepath: relativePath,
      product,
      r2Url
    });
    synced++;
  }

  return ok({ synced, skipped });
};
```

**3. Add fixture sync to syncCommand function**

Find the section in `syncCommand` after template sync (around line 60-80). Add before the final success message:

```typescript
  // Sync fixture images
  logger.info('Syncing fixture images...');
  const fixtureResult = await syncFixtureImages(supabase);

  if (!isOk(fixtureResult)) {
    logger.error('Fixture sync failed', { error: fixtureResult.error.message });
    console.error('\n❌ Fixture sync failed:', fixtureResult.error.message);
  } else {
    const { synced, skipped } = fixtureResult.data;
    logger.info('Fixture sync complete', { synced, skipped });
    console.log(`\n✓ Synced ${synced} fixture images (${skipped} already existed)`);
  }
```

**4. Test fixture sync**

Create test images directory:
```bash
mkdir -p prompt-bench/fixtures/images/test-product
echo "mock image data" > prompt-bench/fixtures/images/test-product/front.jpg
```

Run sync command:
```bash
bun bench sync
```

Expected: Output shows "Synced 1 fixture images"

**5. Verify database**

Run query to check fixture_images table:
```bash
npx supabase db remote exec "SELECT product, filename FROM fixture_images LIMIT 5"
```

Expected: Shows test-product/front.jpg row

**6. Commit**

```bash
git add prompt-bench/commands/sync.ts
git commit -m "feat: add fixture image sync to bun bench sync

- Recursively scan fixtures/images/ directory
- Upload images to R2 with hash-based deduplication
- Store metadata in fixture_images table
- Skip already-synced images by filepath
- Support nested product folders (bag/front.jpg → product: bag)"
```

## Acceptance Criteria

- [ ] Helper functions added to sync.ts
- [ ] syncFixtureImages function implemented
- [ ] Function integrated into syncCommand
- [ ] `bun bench sync` uploads images to R2
- [ ] Database records created in fixture_images table
- [ ] Duplicate images skipped correctly
- [ ] Product name extracted from folder structure
- [ ] Changes committed to git

## Dependencies

- Task 01 (database migration) must be completed first
