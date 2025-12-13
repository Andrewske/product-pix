'use client';

import { useState, memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { safeStringify } from '@/lib/utils/safe-stringify';

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  domain: string;
  source: 'database' | 'other';
  timestamp: string;
  resolvedAt?: string;
  metadata: Record<string, unknown>;
}

interface TimelineEventCardProps {
  event: TimelineEvent;
  onResolve: () => void;
  onUnresolve: () => void;
}

export const TimelineEventCard = memo(function TimelineEventCard({ event, onResolve, onUnresolve }: TimelineEventCardProps) {
  const [expanded, setExpanded] = useState(false);

  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    high: 'bg-orange-100 text-orange-800 border-orange-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return (
    <div className={`border rounded-lg p-4 ${severityColors[event.severity]}`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex gap-2 items-center">
            <Badge variant="outline">{event.domain}</Badge>
            <Badge variant="outline">{event.severity}</Badge>
            {event.source === 'database' && <Badge>DB</Badge>}
          </div>
          <h4 className="font-medium mt-2">{event.title}</h4>
          <p className="text-sm text-muted-foreground">
            {formatDistanceToNow(new Date(event.timestamp))} ago
          </p>
        </div>

        {event.source === 'database' && (
          event.resolvedAt ? (
            <div className="flex gap-2 items-center">
              <Badge variant="success">✓ Resolved</Badge>
              <Button size="sm" variant="ghost" onClick={onUnresolve}>
                Unresolve
              </Button>
            </div>
          ) : (
            <Button size="sm" onClick={onResolve}>
              Resolve
            </Button>
          )
        )}
      </div>

      {event.description && (
        <p className="mt-2 text-sm">{event.description}</p>
      )}

      <Button
        variant="ghost"
        size="sm"
        onClick={() => setExpanded(!expanded)}
        className="mt-2"
      >
        {expanded ? 'Hide' : 'Show'} Details
      </Button>

      {expanded && (
        <pre className="mt-2 text-xs bg-black/5 p-2 rounded overflow-auto max-h-96">
          {safeStringify(event.metadata)}
        </pre>
      )}
    </div>
  );
});