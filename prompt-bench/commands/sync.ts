/**
 * Sync Command - Sync templates and analysis prompts from local files to database
 */

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

  console.log(`\nDone.`);
};
