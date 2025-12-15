'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Send, Filter } from 'lucide-react';
import { format } from 'date-fns';
import type { MessageSummary } from '@/lib/db/admin-messages';

export function MessagesPageClient() {
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, setFilters] = useState({
    sentiment: '' as '' | 'positive' | 'neutral' | 'negative',
    category: '' as '' | 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other',
    userId: '',
    limit: 20,
  });
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const fetchMessages = useCallback(async (pageNum = 0) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'list',
        limit: filters.limit.toString(),
        offset: (pageNum * filters.limit).toString(),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.category && { category: filters.category }),
        ...(filters.userId && { userId: filters.userId }),
      });

      const response = await fetch(`/api/admin/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch messages');

      const data = await response.json();
      setMessages(data.messages);
      setTotal(data.total);
      setPage(pageNum);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendReply = async (userId: string) => {
    if (!replyContent.trim()) return;

    setSending(true);
    try {
      const response = await fetch('/api/admin/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, content: replyContent.trim() }),
      });

      if (!response.ok) throw new Error('Failed to send reply');

      setReplyContent('');
      setReplyingTo(null);
      // Refresh messages
      fetchMessages(page);
    } catch (error) {
      console.error('Error sending reply:', error);
    } finally {
      setSending(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'neutral': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getCategoryColor = () => {
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="sentiment">Sentiment</Label>
              <Select
                value={filters.sentiment}
                onValueChange={(value: '' | 'positive' | 'neutral' | 'negative') => setFilters(prev => ({ ...prev, sentiment: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All sentiments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All sentiments</SelectItem>
                  <SelectItem value="positive">Positive</SelectItem>
                  <SelectItem value="neutral">Neutral</SelectItem>
                  <SelectItem value="negative">Negative</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={filters.category}
                onValueChange={(value: '' | 'bug_report' | 'feature_request' | 'billing' | 'praise' | 'complaint' | 'other') => setFilters(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All categories</SelectItem>
                  <SelectItem value="bug_report">Bug Report</SelectItem>
                  <SelectItem value="feature_request">Feature Request</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="praise">Praise</SelectItem>
                  <SelectItem value="complaint">Complaint</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="userId">User ID</Label>
              <Input
                id="userId"
                placeholder="Filter by user ID"
                value={filters.userId}
                onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="limit">Messages per page</Label>
              <Select
                value={filters.limit.toString()}
                onValueChange={(value) => setFilters(prev => ({ ...prev, limit: parseInt(value, 10) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card>
        <CardHeader>
          <CardTitle>Messages ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No messages found matching the current filters.
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">{message.userEmail || 'Unknown User'}</span>
                          {message.isFromAdmin && <Badge variant="secondary">Admin</Badge>}
                          {message.analysis && (
                            <>
                              <Badge className={getSentimentColor(message.analysis.sentiment)}>
                                {message.analysis.sentiment}
                              </Badge>
                              <Badge className={getCategoryColor()}>
                                {message.analysis.category.replace('_', ' ')}
                              </Badge>
                            </>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap mb-2">{message.content}</p>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                          {message.readAt && (
                            <span className="ml-2">• Read {format(new Date(message.readAt), 'MMM d, h:mm a')}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {!message.isFromAdmin && (
                      <div className="border-t pt-3">
                        {replyingTo === message.id ? (
                          <div className="space-y-3">
                            <Textarea
                              placeholder="Type your reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => handleSendReply(message.userId)}
                                disabled={sending || !replyContent.trim()}
                              >
                                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                Send Reply
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setReplyingTo(message.id)}
                          >
                            Reply
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Pagination */}
          {total > filters.limit && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {page * filters.limit + 1} to {Math.min((page + 1) * filters.limit, total)} of {total} messages
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(page - 1)}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchMessages(page + 1)}
                  disabled={(page + 1) * filters.limit >= total}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}