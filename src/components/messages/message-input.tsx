'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

import type { SubmitMessageParams } from '@/types/messages';

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