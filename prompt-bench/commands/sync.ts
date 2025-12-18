/**
 * Sync Command - Sync templates and analysis prompts from local files to database
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, relative, basename, extname } from 'node:path';
import { createHash } from 'node:crypto';
import { uploadBuffer, getPublicUrl } from '@/lib/r2';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { Result, ok, isOk } from '@bench/core/errors';

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
    const buffer = await readFile(filePath);
    const hash = createHash('sha256')
      .update(buffer)
      .digest('hex')
      .slice(0, 8);

    // Upload to R2
    const fileExt = extname(filename);
    const baseFilename = basename(filename, fileExt);
    const r2Key = `fixtures/${product}-${baseFilename}-${hash}${fileExt}`;

    // Determine content type based on file extension
    const contentType = fileExt.toLowerCase() === '.png' ? 'image/png' :
                       fileExt.toLowerCase() === '.webp' ? 'image/webp' :
                       'image/jpeg';

    let uploadedKey: string;
    try {
      const uploadResult = await uploadBuffer(
        buffer,
        r2Key,
        contentType
      );
      uploadedKey = uploadResult.fileKey;
    } catch (error) {
      logger.error('Failed to upload fixture to R2', {
        filepath: relativePath,
        error: error instanceof Error ? error.message : String(error)
      });
      continue;
    }

    const r2Url = getPublicUrl(uploadedKey);

    // Insert into database
    const { error: insertError } = await supabase
      .from('fixture_images')
      .insert({
        product,
        filename,
        filepath: relativePath,
        r2_url: r2Url,
        r2_key: uploadedKey
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

export const syncCommand = async (): Promise<void> => {
  console.log(`\n🔄 Syncing templates and analysis prompts to database...\n`);

  const { syncAllTemplates } = await import('@bench/db/templates');
  const { syncAllAnalysisPrompts } = await import('@bench/db/analysis-prompts');

  const [templateResult, analysisResult] = await Promise.all([
    syncAllTemplates(),
    syncAllAnalysisPrompts()
  ]);

  const totalSynced = templateResult.synced.length + analysisResult.synced.length;
  const totalErrors = templateResult.errors.length + analysisResult.errors.length;

  if (totalSynced > 0) {
    console.log(`✅ Synced ${templateResult.synced.length} templates, ${analysisResult.synced.length} analysis prompts`);
  }

  if (totalErrors > 0) {
    console.log(`❌ Errors:`);
    for (const e of templateResult.errors) {
      console.log(`   Template ${e.slug}: ${e.error}`);
    }
    for (const e of analysisResult.errors) {
      console.log(`   Analysis ${e.slug}: ${e.error}`);
    }
    process.exit(1);
  }

  // Sync fixture images
  const supabase = createAdminClient();
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

  console.log(`\nDone.`);
};
