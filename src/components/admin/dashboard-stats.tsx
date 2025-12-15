'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { AdminDashboardStats } from '@/lib/db/admin-stats';

interface DashboardStatsProps {
  stats: AdminDashboardStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: 'Users Today',
      value: stats.usersToday,
      description: 'New registrations',
    },
    {
      title: 'Users This Week',
      value: stats.usersThisWeek,
      description: 'Total new users',
    },
    {
      title: 'Active Users Today',
      value: stats.activeUsersToday,
      description: 'Users with activity',
    },
    {
      title: 'Generations Today',
      value: stats.generationsToday,
      description: 'Images generated',
    },
    {
      title: 'Errors Today',
      value: stats.errorsToday,
      description: 'Critical errors',
    },
    {
      title: 'Pending Messages',
      value: stats.pendingMessages,
      description: 'Unread user messages',
    },
    {
      title: 'Pending Refunds',
      value: stats.pendingRefunds,
      description: 'Awaiting approval',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-8">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}