import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logging';
import { Tables } from '@/types/database';

export interface CreateContactMessageParams {
  name: string;
  email: string;
  message: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface ContactMessageResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

export const createContactMessage = async (
  params: CreateContactMessageParams
): Promise<ContactMessageResult> => {
  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('contact_messages')
      .insert({
        name: params.name.trim(),
        email: params.email.toLowerCase().trim(),
        message: params.message.trim(),
        user_agent: params.userAgent,
        ip_address: params.ipAddress,
      })
      .select('id')
      .single();

    if (error) {
      logger.error('Failed to create contact message', { error, params });
      return { success: false, error: 'Database error' };
    }

    logger.info('Contact message created successfully', {
      messageId: data.id,
      email: params.email,
    });

    return { success: true, messageId: data.id };
  } catch (error) {
    logger.error('Unexpected error creating contact message', { error, params });
    return { success: false, error: 'Internal server error' };
  }
};

export const getContactMessage = async (id: string): Promise<Tables<'contact_messages'> | null> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    logger.error('Failed to fetch contact message', { error, id });
    return null;
  }

  return data;
};

export const listContactMessages = async (limit = 50, offset = 0): Promise<Tables<'contact_messages'>[]> => {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.error('Failed to list contact messages', { error, limit, offset });
    return [];
  }

  return data;
};