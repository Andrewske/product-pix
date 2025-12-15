'use client';

import { useState } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { DashboardStats } from '@/components/admin/dashboard-stats';
import { UserFilters } from '@/components/admin/user-filters';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, RefreshCw } from 'lucide-react';
import type { AdminDashboardStats, UserListFilters, UserListItem } from '@/lib/db/admin-stats';

interface UsersListPageClientProps {
  initialStats: AdminDashboardStats;
  initialUserList: { users: UserListItem[]; nextCursor: string | null };
}

async function fetchUsers(filters: UserListFilters, cursor?: string): Promise<{ users: UserListItem[]; nextCursor: string | null }> {
  const params = new URLSearchParams();

  if (filters.search) params.set('search', filters.search);
  if (filters.hasErrors !== undefined) params.set('hasErrors', filters.hasErrors.toString());
  if (filters.hasMessages !== undefined) params.set('hasMessages', filters.hasMessages.toString());
  if (filters.minCredits !== undefined) params.set('minCredits', filters.minCredits.toString());
  if (filters.maxCredits !== undefined) params.set('maxCredits', filters.maxCredits.toString());
  if (filters.createdAfter) params.set('createdAfter', filters.createdAfter);
  if (filters.createdBefore) params.set('createdBefore', filters.createdBefore);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);
  if (cursor) params.set('cursor', cursor);

  params.set('limit', '20');

  const response = await fetch(`/api/admin/users?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch users');
  }
  return response.json();
}

async function fetchStats(): Promise<AdminDashboardStats> {
  const response = await fetch('/api/admin/users/stats');
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
}

export function UsersListPageClient({ initialStats, initialUserList }: UsersListPageClientProps) {
  const router = useRouter();
  const [filters, setFilters] = useState<UserListFilters>({});
  const [stats, setStats] = useState(initialStats);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['admin-users', filters],
    queryFn: ({ pageParam }) => fetchUsers(filters, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: {
      pages: [initialUserList],
      pageParams: [undefined],
    },
  });

  const refreshStats = async () => {
    try {
      const newStats = await fetchStats();
      setStats(newStats);
    } catch (error) {
      console.error('Failed to refresh stats:', error);
    }
  };

  const handleRowClick = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const allUsers = data?.pages.flatMap(page => page.users) || [];
  const isEmpty = allUsers.length === 0 && !isLoading;

  if (isError) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive mb-4">Error loading users: {error?.message}</p>
        <Button onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Dashboard Overview</h2>
        <Button variant="outline" size="sm" onClick={refreshStats}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>
      <DashboardStats stats={stats} />

      {/* User List */}
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <UserFilters
            filters={filters}
            onFiltersChange={setFilters}
            isLoading={isLoading}
          />

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-right">Credits</TableHead>
                  <TableHead className="text-right">Jobs</TableHead>
                  <TableHead className="text-right">Errors</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading && allUsers.length === 0 ? (
                  // Loading skeleton
                  ['skeleton-1', 'skeleton-2', 'skeleton-3', 'skeleton-4', 'skeleton-5', 'skeleton-6', 'skeleton-7', 'skeleton-8', 'skeleton-9', 'skeleton-10'].map((key) => (
                    <TableRow key={key}>
                      <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-12 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-8 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-6 ml-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                    </TableRow>
                  ))
                ) : isEmpty ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No users found matching the current filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  allUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(user.id)}
                    >
                      <TableCell className="font-medium">{user.email}</TableCell>
                      <TableCell>{user.displayName || '-'}</TableCell>
                      <TableCell className="text-right font-mono">{user.creditBalance}</TableCell>
                      <TableCell className="text-right font-mono">{user.jobCount}</TableCell>
                      <TableCell className="text-right">
                        {user.errorCount > 0 ? (
                          <Badge variant="destructive">{user.errorCount}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {hasNextPage && (
            <div className="flex justify-center mt-6">
              <Button
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
                variant="outline"
              >
                {isFetchingNextPage ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Users'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}