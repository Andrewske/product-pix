// src/lib/db/generated-images.ts
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import type { GeneratedImage } from '@/types';

export interface CreateGeneratedImageParams {
  jobId: string;
  userId: string;
  fileKey: string;
  publicUrl: string;
  width: number;
  height: number;
  fileSize?: number;
}

export const createGeneratedImage = async (
  params: CreateGeneratedImageParams
): Promise<GeneratedImage | null> => {
  const supabase = createAdminClient();

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
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating generated image record:', error);
    return null;
  }

  return data;
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
    console.error('Error fetching generated images:', error);
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
