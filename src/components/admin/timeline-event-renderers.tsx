'use client';

import { memo } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ImageIcon,
  MessageSquare,
  CreditCard,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Upload,
  Settings,
  CheckCircle,
  Clock,
  Coins,
  FileImage,
  DollarSign
} from 'lucide-react';
import type { TimelineEvent } from '@/lib/db/admin-timeline';

interface TimelineEventRendererProps {
  event: TimelineEvent;
  onResolve?: () => void;
  onUnresolve?: () => void;
}

// Event type configurations
const EVENT_CONFIGS = {
  job: {
    icon: Settings,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
  },
  transaction: {
    icon: CreditCard,
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
  },
  message: {
    icon: MessageSquare,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
  },
  image: {
    icon: ImageIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 border-indigo-200',
  },
  feedback: {
    icon: ThumbsUp,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
  },
  error: {
    icon: AlertTriangle,
    color: 'text-red-600',
    bgColor: 'bg-red-50 border-red-200',
  },
  activity: {
    icon: Activity,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50 border-gray-200',
  },
  upload: {
    icon: Upload,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 border-teal-200',
  },
} as const;

export const TimelineEventRenderers = memo(function TimelineEventRenderers({
  event,
  onResolve,
  onUnresolve
}: TimelineEventRendererProps) {
  const config = EVENT_CONFIGS[event.type];
  const Icon = config.icon;

  return (
    <Card className={`p-4 ${config.bgColor}`}>
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-full bg-white border ${config.color}`}>
          <Icon size={16} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-medium text-sm">{event.title}</h4>
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(event.timestamp), { addSuffix: true })}
              </p>
            </div>

            {event.type === 'error' && (
              <ErrorActions
                event={event}
                onResolve={onResolve}
                onUnresolve={onUnresolve}
              />
            )}
          </div>

          <EventDetails event={event} />
        </div>
      </div>
    </Card>
  );
});

function ErrorActions({
  event,
  onResolve,
  onUnresolve
}: {
  event: TimelineEvent;
  onResolve?: () => void;
  onUnresolve?: () => void;
}) {
  const isResolved = event.metadata.resolved_at;

  if (isResolved) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="default" className="text-xs">
          <CheckCircle size={10} className="mr-1" />
          Resolved
        </Badge>
        {onUnresolve && (
          <Button size="sm" variant="ghost" onClick={onUnresolve}>
            Unresolve
          </Button>
        )}
      </div>
    );
  }

  return onResolve ? (
    <Button size="sm" onClick={onResolve}>
      Resolve
    </Button>
  ) : null;
}

function EventDetails({ event }: { event: TimelineEvent }) {
  switch (event.type) {
    case 'job':
      return <JobEventDetails event={event} />;
    case 'transaction':
      return <TransactionEventDetails event={event} />;
    case 'message':
      return <MessageEventDetails event={event} />;
    case 'image':
      return <ImageEventDetails event={event} />;
    case 'feedback':
      return <FeedbackEventDetails event={event} />;
    case 'error':
      return <ErrorEventDetails event={event} />;
    case 'activity':
      return <ActivityEventDetails event={event} />;
    case 'upload':
      return <UploadEventDetails event={event} />;
    default:
      return null;
  }
}

function JobEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    template_slug?: string;
    status?: string;
    credits_charged?: number;
    prompt?: string;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <Settings size={12} />
          <span>{metadata.template_slug || 'Unknown'}</span>
        </div>
        <Badge variant={metadata.status === 'completed' ? 'default' : 'secondary'}>
          {metadata.status || 'Unknown'}
        </Badge>
        <div className="flex items-center gap-1">
          <Coins size={12} />
          <span>{metadata.credits_charged || 0} credits</span>
        </div>
      </div>
      {metadata.prompt && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          &ldquo;{metadata.prompt}&rdquo;
        </p>
      )}
    </div>
  );
}

function TransactionEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    transaction_type?: string;
    amount?: number;
    balance_after?: number;
  };

  return (
    <div className="mt-3 space-y-1 text-xs">
      <div className="flex items-center gap-2">
        <Badge variant="outline">{metadata.transaction_type || 'Unknown'}</Badge>
        <span className={(metadata.amount || 0) > 0 ? 'text-green-600' : 'text-red-600'}>
          {(metadata.amount || 0) > 0 ? '+' : ''}{(metadata.amount || 0)} credits
        </span>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground">
        <DollarSign size={12} />
        <span>Balance: {metadata.balance_after || 0} credits</span>
      </div>
    </div>
  );
}

function MessageEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    content?: string;
    is_from_admin?: boolean;
    read_at?: string;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={metadata.is_from_admin ? 'default' : 'secondary'}>
          {metadata.is_from_admin ? 'Admin' : 'User'}
        </Badge>
        {metadata.read_at && (
          <Badge variant="default" className="text-xs">
            <CheckCircle size={10} className="mr-1" />
            Read
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground line-clamp-3 bg-white/50 p-2 rounded">
        {metadata.content || ''}
      </p>
    </div>
  );
}

function ImageEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    public_url?: string;
    is_favorite?: boolean;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        {metadata.public_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={metadata.public_url}
            alt="Generated content"
            className="w-16 h-16 object-cover rounded border"
          />
        )}
        {metadata.is_favorite && (
          <Badge variant="default" className="text-xs">
            <ThumbsUp size={10} className="mr-1" />
            Favorite
          </Badge>
        )}
      </div>
    </div>
  );
}

function FeedbackEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    feedback_type?: string;
    comment?: string;
    reasons?: string[];
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <Badge variant={metadata.feedback_type === 'thumbs_up' ? 'default' : 'destructive'}>
          {metadata.feedback_type === 'thumbs_up' ? (
            <ThumbsUp size={12} className="mr-1" />
          ) : (
            <ThumbsDown size={12} className="mr-1" />
          )}
          {metadata.feedback_type === 'thumbs_up' ? 'Positive' : 'Negative'}
        </Badge>
      </div>
      {metadata.reasons && Array.isArray(metadata.reasons) && metadata.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {metadata.reasons.map((reason: string) => (
            <Badge key={reason} variant="outline" className="text-xs">
              {reason}
            </Badge>
          ))}
        </div>
      )}
      {metadata.comment && (
        <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
          {metadata.comment}
        </p>
      )}
    </div>
  );
}

function ErrorEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    severity?: string;
    domain?: string;
    error_message?: string;
    resolved_at?: string;
  };

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant={
          metadata.severity === 'critical' ? 'destructive' :
          metadata.severity === 'high' ? 'destructive' :
          metadata.severity === 'medium' ? 'secondary' : 'outline'
        }>
          {metadata.severity || 'Unknown'}
        </Badge>
        <Badge variant="outline">{metadata.domain || 'Unknown'}</Badge>
        {metadata.resolved_at && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock size={12} />
            <span>Resolved {formatDistanceToNow(new Date(metadata.resolved_at), { addSuffix: true })}</span>
          </div>
        )}
      </div>
      {metadata.error_message && (
        <p className="text-xs text-muted-foreground bg-white/50 p-2 rounded">
          {metadata.error_message}
        </p>
      )}
    </div>
  );
}

function ActivityEventDetails({ event }: { event: TimelineEvent }) {
  const properties = event.metadata as Record<string, unknown>;

  return (
    <div className="mt-3">
      <div className="text-xs text-muted-foreground">
        {Object.keys(properties).length > 0 && (
          <div className="bg-white/50 p-2 rounded space-y-1">
            {Object.entries(properties).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className="font-medium">{key}:</span>
                <span>{String(value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UploadEventDetails({ event }: { event: TimelineEvent }) {
  const metadata = event.metadata as {
    filename?: string;
    file_size?: number;
    mime_type?: string;
  };

  return (
    <div className="mt-3 space-y-1 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <FileImage size={12} />
        <span>{metadata.filename || 'Unknown file'}</span>
      </div>
      <div className="flex items-center gap-4">
        <span>{metadata.mime_type || 'Unknown type'}</span>
        <span>{metadata.file_size || 0} bytes</span>
      </div>
    </div>
  );
}