/**
 * Sync Command - Sync templates from local files to database
 */

export const syncCommand = async (): Promise<void> => {
  console.log(`\n🔄 Syncing templates to database...\n`);

  const { syncAllTemplates } = await import('@/lib/prompts');
  const result = await syncAllTemplates();

  if (result.synced.length > 0) {
    console.log(`✅ Synced: ${result.synced.join(', ')}`);
  }

  if (result.errors.length > 0) {
    console.log(`❌ Errors:`);
    for (const e of result.errors) {
      console.log(`   ${e.slug}: ${e.error}`);
    }
  }

  console.log(`\nDone.`);
};
