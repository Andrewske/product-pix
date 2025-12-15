'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

import { useMessages } from '@/hooks/use-messages';

import { MessageInput } from './message-input';
import { MessageList } from './message-list';

interface ChatPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ChatPanel = ({ isOpen, onClose }: ChatPanelProps) => {
  const { messages, loading, error, sendMessage, sending } = useMessages();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Messages</SheetTitle>
        </SheetHeader>

        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <MessageList messages={messages} loading={loading} />
          <MessageInput onSend={sendMessage} sending={sending} />
        </div>
      </SheetContent>
    </Sheet>
  );
};