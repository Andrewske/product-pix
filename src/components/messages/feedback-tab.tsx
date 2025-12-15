'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/use-messages';

import { ChatPanel } from './chat-panel';

export const FeedbackTab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { unreadCount } = useMessages();

  return (
    <>
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-40">
        <Button
          onClick={() => setIsOpen(true)}
          className="rounded-l-lg rounded-r-none h-16 px-4"
          variant="default"
        >
          <MessageCircle className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      <ChatPanel isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
};