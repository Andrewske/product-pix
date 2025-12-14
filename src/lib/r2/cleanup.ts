import { CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET } from './client';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';

export interface R2CleanupResult {
  success: boolean;
  filesMoved: number;
  keys: string[];
}

/**
 * Move user's R2 files to deleted/ prefix for lifecycle cleanup
 */
export async function queueUserFilesForDeletion(userId: string): Promise<R2CleanupResult> {
  const supabase = createAdminClient();

  // Get all non-deleted uploads
  const { data: uploads } = await supabase
    .from('uploads')
    .select('file_key')
    .eq('user_id', userId)
    .is('deleted_at', null);

  // Get all non-deleted generated images
  const { data: images } = await supabase
    .from('generated_images')
    .select('file_key')
    .eq('user_id', userId)
    .is('deleted_at', null);

  const allKeys = [
    ...(uploads?.map(u => u.file_key) || []),
    ...(images?.map(i => i.file_key) || [])
  ];

  const movedKeys: string[] = [];

  // Move each file to deleted/ prefix
  for (const key of allKeys) {
    const newKey = `deleted/${userId}/${key}`;

    try {
      // Copy to new location
      await r2Client().send(new CopyObjectCommand({
        Bucket: R2_BUCKET(),
        CopySource: `${R2_BUCKET()}/${key}`,
        Key: newKey
      }));

      // Delete original
      await r2Client().send(new DeleteObjectCommand({
        Bucket: R2_BUCKET(),
        Key: key
      }));

      movedKeys.push(newKey);
    } catch (error) {
      logger.error('Failed to move R2 file', { key, error });
    }
  }

  // Get user email for audit
  const { data: user } = await supabase
    .from('users')
    .select('original_email')
    .eq('id', userId)
    .single();

  // Log to audit table
  await supabase.from('account_deletion_audit').insert({
    user_id: userId,
    email: user?.original_email || '',
    r2_files_queued: movedKeys.length,
    r2_keys: movedKeys
  });

  return {
    success: true,
    filesMoved: movedKeys.length,
    keys: movedKeys
  };
}