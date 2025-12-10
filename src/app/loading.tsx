import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

export default function Loading() {
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <Skeleton className="h-10 w-64 mx-auto mb-4" />
        <Skeleton className="h-6 w-full max-w-2xl mx-auto mb-2" />
        <Skeleton className="h-6 w-3/4 max-w-2xl mx-auto" />
      </div>

      <div className="grid gap-12">
        {/* Credit Packs Section */}
        <div>
          <Skeleton className="h-8 w-40 mx-auto mb-6" />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-24" />
                    {i === 1 && <Skeleton className="h-5 w-20" />}
                  </div>
                  <Skeleton className="h-4 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-40" />
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription Tiers Section */}
        <div>
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {Array.from({ length: 2 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Skeleton className="h-6 w-20" />
                    {i === 1 && <Skeleton className="h-5 w-24" />}
                  </div>
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-32 mb-4" />
                  <div className="space-y-2">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="flex items-center">
                        <Skeleton className="h-4 w-4 mr-2" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-10 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 text-center">
        <Skeleton className="h-4 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}