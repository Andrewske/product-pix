# Frontend: Message Components

## Files to Create
- `src/components/messages/feedback-tab.tsx` (new)
- `src/components/messages/chat-panel.tsx` (new)
- `src/components/messages/message-list.tsx` (new)
- `src/components/messages/message-input.tsx` (new)
- `src/components/messages/index.ts` (new - barrel export)

## Implementation Details

### Floating Feedback Tab

**File**: `src/components/messages/feedback-tab.tsx`

```typescript
'use client';

import { useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChatPanel } from './chat-panel';
import { useMessages } from '@/hooks/use-messages';

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
```

### Chat Panel (Sheet)

**File**: `src/components/messages/chat-panel.tsx`

Use shadcn/ui Sheet component:

```typescript
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { MessageList } from './message-list';
import { MessageInput } from './message-input';
import { useMessages } from '@/hooks/use-messages';

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
```

### Message List

**File**: `src/components/messages/message-list.tsx`

```typescript
'use client';

import { useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { UserMessage } from '@/types';

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
  }, [messages]);

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
```

### Message Input

**File**: `src/components/messages/message-input.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import type { SubmitMessageParams } from '@/types';

interface MessageInputProps {
  onSend: (params: SubmitMessageParams) => Promise<boolean>;
  sending: boolean;
}

const MAX_LENGTH = 2000;

export const MessageInput = ({ onSend, sending }: MessageInputProps) => {
  const [content, setContent] = useState('');

  const handleSend = async () => {
    if (!content.trim() || sending) return;

    const success = await onSend({ content: content.trim() });
    if (success) {
      setContent('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t pt-4 space-y-2">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        maxLength={MAX_LENGTH}
        rows={3}
        disabled={sending}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {content.length}/{MAX_LENGTH}
        </span>
        <Button
          onClick={handleSend}
          disabled={!content.trim() || sending}
          size="sm"
        >
          <Send className="h-4 w-4 mr-2" />
          Send
        </Button>
      </div>
    </div>
  );
};
```

### Barrel Export

**File**: `src/components/messages/index.ts`

```typescript
export { FeedbackTab } from './feedback-tab';
export { ChatPanel } from './chat-panel';
export { MessageList } from './message-list';
export { MessageInput } from './message-input';
```

## shadcn/ui Components Used
- `Sheet` - For slide-out panel
- `ScrollArea` - For message list scrolling
- `Button` - For tab and send button
- `Badge` - For unread count and admin indicator
- `Textarea` - For message input

## Reference Patterns
- Design system from `docs/design-system.md`
- Component patterns from existing feedback components

## Acceptance Criteria
- ✅ FeedbackTab shows unread count badge
- ✅ ChatPanel slides out from right using Sheet
- ✅ MessageList auto-scrolls to bottom on new messages
- ✅ MessageInput enforces 2000 char limit
- ✅ Enter sends message, Shift+Enter adds newline
- ✅ Visual distinction between user and admin messages
- ✅ Loading states shown appropriately
- ✅ Follows ProductPix design principles (clean, minimal)
