// src/lib/db/uploads.ts
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { Upload, UploadInsert } from '@/types';

export const createUpload = async (
  upload: UploadInsert
): Promise<Upload | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('uploads')
    .insert(upload)
    .select()
    .single();

  if (error) {
    logger.error('Error creating upload', {
      error: error.message,
      userId: upload.user_id,
      fileKey: upload.file_key,
      fileName: upload.filename,
      fileSize: upload.file_size,
    });
    return null;
  }

  return data;
};

export const getUpload = async (uploadId: string): Promise<Upload | null> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('id', uploadId)
    .is('deleted_at', null)
    .single();

  if (error) {
    logger.error('Error fetching upload', {
      error: error.message,
      uploadId,
    });
    return null;
  }

  return data;
};

export const getUserUploads = async (
  userId: string,
  limit = 50
): Promise<Upload[]> => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('uploads')
    .select('*')
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    logger.error('Error fetching uploads', {
      error: error.message,
      userId,
      limit,
    });
    return [];
  }

  return data;
};

export const softDeleteUpload = async (uploadId: string): Promise<boolean> => {
  const supabase = await createClient();

  const { error } = await supabase
    .from('uploads')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', uploadId);

  if (error) {
    logger.error('Error deleting upload', {
      error: error.message,
      uploadId,
    });
    return false;
  }

  return true;
};