// src/lib/db/feedback.ts
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import type { ImageFeedback, SubmitFeedbackParams } from '@/types';

export const submitFeedback = async (
  userId: string,
  params: SubmitFeedbackParams
): Promise<ImageFeedback | null> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('image_feedback')
    .upsert(
      {
        user_id: userId,
        image_id: params.imageId,
        feedback_type: params.feedbackType,
        reasons: params.reasons,
        comment: params.comment ?? null,
      },
      {
        onConflict: 'user_id,image_id',
        ignoreDuplicates: false,
      }
    )
    .select()
    .single();

  if (error) {
    logger.error('Error submitting feedback', {
      error: error.message,
      userId,
      imageId: params.imageId,
      feedbackType: params.feedbackType,
    });
    return null;
  }

  // Convert snake_case to camelCase for the interface
  return {
    id: data.id,
    imageId: data.image_id,
    userId: data.user_id,
    feedbackType: data.feedback_type,
    reasons: data.reasons,
    comment: data.comment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const getFeedbackForImage = async (
  imageId: string,
  userId: string
): Promise<ImageFeedback | null> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('image_feedback')
    .select('*')
    .eq('image_id', imageId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows returned - this is expected when no feedback exists
      return null;
    }

    logger.error('Error getting feedback for image', {
      error: error.message,
      imageId,
      userId,
    });
    return null;
  }

  // Convert snake_case to camelCase for the interface
  return {
    id: data.id,
    imageId: data.image_id,
    userId: data.user_id,
    feedbackType: data.feedback_type,
    reasons: data.reasons,
    comment: data.comment,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

export const deleteFeedback = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from('image_feedback')
    .delete()
    .eq('image_id', imageId)
    .eq('user_id', userId);

  if (error) {
    logger.error('Error deleting feedback', {
      error: error.message,
      imageId,
      userId,
    });
    return false;
  }

  return true;
};