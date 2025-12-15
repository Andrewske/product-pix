'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUser } from '@/lib/auth/hooks';
import { logger } from '@/lib/logging';
import type { UserMessage, SubmitMessageParams } from '@/types/messages';

export interface UseMessagesReturn {
  messages: UserMessage[];
  loading: boolean;
  error: string | null;
  sending: boolean;
  sendMessage: (params: SubmitMessageParams) => Promise<boolean>;
  markAsRead: (messageId: string) => Promise<boolean>;
  unreadCount: number;
}

export const useMessages = (): UseMessagesReturn => {
  const { user } = useUser();
  const [messages, setMessages] = useState<UserMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch initial messages
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const fetchMessages = async () => {
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        const data = await response.json();
        setMessages(data.messages || []);
        setError(null);
      } catch (err) {
        logger.error('Error fetching messages', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const supabase = createClient();
    const channel = supabase
      .channel('user_messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_messages',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setMessages((prev) => [...prev, payload.new as UserMessage]);
          } else if (payload.eventType === 'UPDATE') {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.id === payload.new.id ? (payload.new as UserMessage) : msg
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const sendMessage = useCallback(
    async (params: SubmitMessageParams): Promise<boolean> => {
      if (!user) return false;

      setSending(true);
      setError(null);

      try {
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to send message');
        }

        return true;
      } catch (err) {
        logger.error('Error sending message', { error: err });
        setError(err instanceof Error ? err.message : 'Failed to send message');
        return false;
      } finally {
        setSending(false);
      }
    },
    [user]
  );

  const markAsRead = useCallback(async (messageId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/messages/${messageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_read' }),
      });

      return response.ok;
    } catch (err) {
      logger.error('Error marking message as read', { error: err });
      return false;
    }
  }, []);

  const unreadCount = messages.filter(
    (msg) => msg.isFromAdmin && !msg.readAt
  ).length;

  return {
    messages,
    loading,
    error,
    sending,
    sendMessage,
    markAsRead,
    unreadCount,
  };
};