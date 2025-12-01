// src/lib/db/uploads.ts
import { createClient } from '@/lib/supabase/server';
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
    console.error('Error creating upload:', error);
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
    console.error('Error fetching upload:', error);
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
    console.error('Error fetching uploads:', error);
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
    console.error('Error deleting upload:', error);
    return false;
  }

  return true;
};