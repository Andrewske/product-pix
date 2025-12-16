'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  RefreshCw,
  ImageIcon,
  MessageSquare,
  Coins,
  User
} from 'lucide-react';

interface UserQuickActionsProps {
  userId: string;
  onRefresh: () => void;
}

export function UserQuickActions({ userId, onRefresh }: UserQuickActionsProps) {
  const handleViewImages = () => {
    // Navigate to user's images - could use router or window.location
    if (typeof window !== 'undefined') {
      window.open(`/admin/users/${userId}/images`, '_blank');
    }
  };

  const handleViewMessages = () => {
    // Navigate to user's messages
    if (typeof window !== 'undefined') {
      window.open(`/admin/users/${userId}/messages`, '_blank');
    }
  };

  const handleAddCredits = () => {
    // Open add credits modal or navigate to credits page
    if (typeof window !== 'undefined') {
      window.open(`/admin/users/${userId}/credits`, '_blank');
    }
  };

  const handleImpersonateUser = () => {
    // This would require special handling - disabled for now
    alert('Impersonation feature not yet implemented');
  };

  return (
    <Card className="p-4">
      <h3 className="font-medium text-sm mb-3">Quick Actions</h3>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onRefresh}
          className="flex items-center gap-2"
        >
          <RefreshCw size={14} />
          Refresh
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleViewImages}
          className="flex items-center gap-2"
        >
          <ImageIcon size={14} />
          View Images
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleViewMessages}
          className="flex items-center gap-2"
        >
          <MessageSquare size={14} />
          View Messages
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleAddCredits}
          className="flex items-center gap-2"
        >
          <Coins size={14} />
          Add Credits
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={handleImpersonateUser}
          disabled
          className="flex items-center gap-2 opacity-50"
        >
          <User size={14} />
          Impersonate
        </Button>
      </div>
    </Card>
  );
}