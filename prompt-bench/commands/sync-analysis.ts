import { syncAllAnalysisPrompts } from '@bench/db/analysis-prompts';
import { logger } from '@/lib/logging';

export async function syncAnalysisCommand(): Promise<void> {
  logger.info('Syncing analysis prompts to database...');

  const results = await syncAllAnalysisPrompts();

  if (results.synced.length > 0) {
    logger.info(`✓ Synced ${results.synced.length} analysis prompts:`);
    results.synced.forEach(slug => logger.info(`  - ${slug}`));
  }

  if (results.errors.length > 0) {
    logger.error(`✗ Failed to sync ${results.errors.length} analysis prompts:`);
    results.errors.forEach(({ slug, error }) => {
      logger.error(`  - ${slug}: ${error}`);
    });
    process.exit(1);
  }

  logger.info('Analysis prompt sync complete');
}
