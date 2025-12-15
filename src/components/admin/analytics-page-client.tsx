'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, TrendingUp, MessageSquare, BarChart3 } from 'lucide-react';
import { format } from 'date-fns';
import type { MessageAnalytics, MessageSummary } from '@/lib/db/admin-messages';

export function AnalyticsPageClient() {
  const [analytics, setAnalytics] = useState<MessageAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async (daysParam: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        action: 'analytics',
        days: daysParam.toString(),
        limit: '20',
      });

      const response = await fetch(`/api/admin/analytics/messages?${params}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');

      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics(days);
  }, [fetchAnalytics, days]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Failed to load analytics data.
      </div>
    );
  }

  const { stats, recentMessages } = analytics;

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Label htmlFor="days">Time Range:</Label>
            <Select
              value={days.toString()}
              onValueChange={(value) => setDays(parseInt(value, 10))}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
                <SelectItem value="365">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMessages}</div>
            <p className="text-xs text-muted-foreground">
              {stats.analyzedMessages} analyzed ({((stats.analyzedMessages / stats.totalMessages) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Positive Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.sentimentBreakdown.positive}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sentimentBreakdown.positivePercentage.toFixed(1)}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neutral Sentiment</CardTitle>
            <BarChart3 className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {stats.sentimentBreakdown.neutral}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sentimentBreakdown.neutralPercentage.toFixed(1)}% of analyzed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Negative Sentiment</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600 rotate-180" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {stats.sentimentBreakdown.negative}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.sentimentBreakdown.negativePercentage.toFixed(1)}% of analyzed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.categoryBreakdown).map(([category, count]) => (
              <div key={category} className="text-center">
                <div className="text-2xl font-bold mb-1">{count}</div>
                <Badge className={getCategoryColor()}>
                  {category.replace('_', ' ')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Messages */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentMessages.map((message: MessageSummary) => (
              <div key={message.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
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
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(message.createdAt), 'MMM d, h:mm a')}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}