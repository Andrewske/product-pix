// src/lib/db/generated-images.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { GeneratedImage } from '@/types';

export interface CreateGeneratedImageParams {
  jobId: string;
  userId: string;
  fileKey: string;
  publicUrl: string;
  width: number;
  height: number;
  fileSize?: number;
  title?: string;
}

export const createGeneratedImage = async (
  params: CreateGeneratedImageParams
): Promise<GeneratedImage | null> => {
  const supabase = createAdminClient();

  let title = params.title;
  let attempt = 0;
  const maxRetries = 10;

  while (attempt < maxRetries) {
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        job_id: params.jobId,
        user_id: params.userId,
        file_key: params.fileKey,
        public_url: params.publicUrl,
        width: params.width,
        height: params.height,
        file_size: params.fileSize ?? null,
        title: title || null,
      })
      .select()
      .single();

    if (!error) {
      return data;
    }

    // Check if it's a unique constraint violation on title
    if (error.code === '23505' && error.message.includes('idx_generated_images_user_title') && title) {
      // Try with incremented suffix
      attempt++;
      const baseTitle = title.replace(/-\d+$/, ''); // Remove existing suffix
      title = `${baseTitle}-${attempt}`;
      continue;
    }

    // Other error, don't retry
    logger.error('Error creating generated image record', { error });
    return null;
  }

  logger.error('Failed to create generated image after max retries due to title conflicts');
  return null;
};

export const getUserGeneratedImages = async (
  userId: string,
  limit = 50
): Promise<GeneratedImage[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('generated_images')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching generated images', {
      error: error.message,
      userId,
      limit,
    });
    return [];
  }

  return data;
};

export const toggleFavorite = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createClient();

  // Get current state
  const { data: current } = await supabase
    .from('generated_images')
    .select('is_favorite')
    .eq('id', imageId)
    .eq('user_id', userId)
    .single();

  if (!current) return false;

  // Toggle
  const { error } = await supabase
    .from('generated_images')
    .update({ is_favorite: !current.is_favorite })
    .eq('id', imageId)
    .eq('user_id', userId);

  return !error;
};

export const softDeleteImage = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('generated_images')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', imageId)
    .eq('user_id', userId);

  return !error;
};
