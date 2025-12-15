'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

import type { UserMessage } from '@/types/messages';

interface MessageListProps {
  messages: UserMessage[];
  loading: boolean;
}

export const MessageList = ({ messages, loading }: MessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
        No messages yet. Send us a message!
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
      <div className="space-y-4 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex flex-col ${
              message.isFromAdmin ? 'items-start' : 'items-end'
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.isFromAdmin
                  ? 'bg-muted text-foreground'
                  : 'bg-primary text-primary-foreground'
              }`}
            >
              {message.isFromAdmin && (
                <Badge variant="secondary" className="mb-1">
                  Admin
                </Badge>
              )}
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            </div>
            <span className="text-xs text-muted-foreground mt-1">
              {format(new Date(message.createdAt), 'MMM d, h:mm a')}
            </span>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};