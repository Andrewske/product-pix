'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function UserDetailSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div>
          <Skeleton className="h-8 w-48 mb-4" />
          <Card>
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-32" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div>
                  <Skeleton className="h-4 w-8 mb-2" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div>
                  <Skeleton className="h-4 w-12 mb-2" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
              <div className="border-t pt-4">
                <Skeleton className="h-5 w-32 mb-3" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Skeleton className="h-4 w-28 mb-2" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div>
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Skeleton className="h-7 w-40 mb-4" />
          <div className="space-y-4">
            <div className="flex gap-4 flex-wrap">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col gap-1">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-32" />
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center mb-2">
                          <Skeleton className="h-5 w-16" />
                          <Skeleton className="h-5 w-12" />
                          <Skeleton className="h-5 w-8" />
                        </div>
                        <Skeleton className="h-5 w-48 mb-1" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                    </div>
                    <Skeleton className="h-4 w-64 mt-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}