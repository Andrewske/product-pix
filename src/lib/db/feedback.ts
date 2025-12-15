// src/lib/db/feedback.ts
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logging';
import type { ImageFeedback, SubmitFeedbackParams, FeedbackReason } from '@/types';

// Type for database row shape
interface DbFeedbackRow {
  id: string;
  image_id: string;
  user_id: string;
  feedback_type: 'positive' | 'negative';
  reasons: string[];
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// Helper function to map database row to interface
const mapDbFeedbackToInterface = (data: DbFeedbackRow): ImageFeedback => ({
  id: data.id,
  imageId: data.image_id,
  userId: data.user_id,
  feedbackType: data.feedback_type,
  reasons: data.reasons as FeedbackReason[],
  comment: data.comment,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

export const submitFeedback = async (
  userId: string,
  params: SubmitFeedbackParams
): Promise<ImageFeedback | null> => {
  const supabase = await createClient();

  // Verify user owns the image before allowing feedback
  const { data: imageData, error: imageError } = await supabase
    .from('generated_images')
    .select('id')
    .eq('id', params.imageId)
    .eq('user_id', userId)
    .single();

  if (imageError || !imageData) {
    logger.error('User does not own image or image does not exist', {
      userId,
      imageId: params.imageId,
      error: imageError?.message,
    });
    return null;
  }

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

  return mapDbFeedbackToInterface(data);
};

export const getFeedbackForImage = async (
  imageId: string,
  userId: string
): Promise<ImageFeedback | null> => {
  const supabase = await createClient();

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

  return mapDbFeedbackToInterface(data);
};

export const deleteFeedback = async (
  imageId: string,
  userId: string
): Promise<boolean> => {
  const supabase = await createClient();

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