import { describe, it, expect } from 'bun:test';
import { render, screen } from '@testing-library/react';
import { MessageList } from '../message-list';
import type { UserMessage } from '@/types/messages';

const mockMessages: UserMessage[] = [
  {
    id: '1',
    userId: 'user-1',
    content: 'User message',
    isFromAdmin: false,
    readAt: null,
    analysis: null,
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
  },
  {
    id: '2',
    userId: 'user-1',
    content: 'Admin reply',
    isFromAdmin: true,
    readAt: null,
    analysis: null,
    createdAt: '2025-01-01T01:00:00Z',
    updatedAt: '2025-01-01T01:00:00Z',
  },
];

describe('MessageList', () => {
  it('renders messages', () => {
    render(<MessageList messages={mockMessages} loading={false} />);

    const userMsg = screen.getByText('User message');
    const adminMsg = screen.getByText('Admin reply');

    expect(userMsg).not.toBeNull();
    expect(adminMsg).not.toBeNull();
  });

  it('shows loading state', () => {
    render(<MessageList messages={[]} loading={true} />);

    const loader = document.querySelector('.animate-spin');
    expect(loader).not.toBeNull();
  });

  it('shows empty state', () => {
    render(<MessageList messages={[]} loading={false} />);

    const emptyText = screen.getByText(/No messages yet/i);
    expect(emptyText).not.toBeNull();
  });

  it('distinguishes user vs admin messages visually', () => {
    render(<MessageList messages={mockMessages} loading={false} />);

    // Admin messages should have Badge with "Admin" text
    const adminBadge = screen.getByText('Admin');
    expect(adminBadge).not.toBeNull();

    // Check that user message is aligned to end (items-end)
    const userMessageContainer = screen.getByText('User message').closest('.flex-col');
    expect(userMessageContainer?.classList.contains('items-end')).toBe(true);

    // Check that admin message is aligned to start (items-start)
    const adminMessageContainer = screen.getByText('Admin reply').closest('.flex-col');
    expect(adminMessageContainer?.classList.contains('items-start')).toBe(true);
  });

  it('formats timestamps correctly', () => {
    render(<MessageList messages={mockMessages} loading={false} />);

    // Should show formatted timestamps
    expect(screen.getByText('Jan 1, 12:00 AM')).not.toBeNull();
    expect(screen.getByText('Jan 1, 1:00 AM')).not.toBeNull();
  });

  it('preserves message formatting with whitespace', () => {
    const messageWithNewlines: UserMessage = {
      id: '3',
      userId: 'user-1',
      content: 'Line 1\nLine 2\n  Indented',
      isFromAdmin: false,
      readAt: null,
      analysis: null,
      createdAt: '2025-01-01T02:00:00Z',
      updatedAt: '2025-01-01T02:00:00Z',
    };

    render(<MessageList messages={[messageWithNewlines]} loading={false} />);

    const messageElement = screen.getByText(/Line 1/);
    expect(messageElement?.classList.contains('whitespace-pre-wrap')).toBe(true);
  });

  it('limits message width to 80%', () => {
    render(<MessageList messages={mockMessages} loading={false} />);

    const messageBubbles = document.querySelectorAll('.max-w-\\[80\\%\\]');
    expect(messageBubbles.length).toBe(2);
  });
});