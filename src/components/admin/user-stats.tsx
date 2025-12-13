'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface User {
  id: string;
  email: string;
  display_name: string | null;
  tier: 'free' | 'pro' | 'business';
  credit_balance: number;
  created_at: string;
  is_admin: boolean;
}

interface UserStatsProps {
  user: User;
  totalGenerations?: number;
  unresolvedCriticalErrors?: number;
  unresolvedHighErrors?: number;
  totalErrorsLast30Days?: number;
}

export function UserStats({
  user,
  totalGenerations = 0,
  unresolvedCriticalErrors = 0,
  unresolvedHighErrors = 0,
  totalErrorsLast30Days = 0,
}: UserStatsProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">Email</div>
            <p className="text-sm">{user.email}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Tier</div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{user.tier}</Badge>
              {user.is_admin && <Badge variant="destructive">Admin</Badge>}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Credits</div>
            <p className="text-sm">{user.credit_balance.toLocaleString()}</p>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">Account Created</div>
            <p className="text-sm">{formatDate(user.created_at)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Activity Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Total Generations</div>
              <p className="text-sm">{totalGenerations.toLocaleString()}</p>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Errors (Last 30 Days)</div>
              <p className="text-sm">{totalErrorsLast30Days}</p>
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          <h4 className="text-sm font-medium mb-3">Unresolved Errors</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Critical</div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${unresolvedCriticalErrors > 0 ? 'text-red-600 font-medium' : ''}`}>
                  {unresolvedCriticalErrors}
                </span>
                {unresolvedCriticalErrors > 0 && <Badge variant="destructive">!</Badge>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">High Priority</div>
              <p className="text-sm">{unresolvedHighErrors}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}