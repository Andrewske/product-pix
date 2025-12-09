import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserGeneratedImages } from '@/lib/db/generated-images';
import { getUserBatches } from '@/lib/db/batch';
import { ImageGallery } from '@/components/image-gallery';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const images = await getUserGeneratedImages(user.id);
  const recentBatches = await getUserBatches(user.id, { limit: 3 });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Your Images</h1>
        <div className="flex gap-2">
          <Link href="/batch/new">
            <Button variant="outline">Create Batch</Button>
          </Link>
          <Link href="/generate">
            <Button>Generate New</Button>
          </Link>
        </div>
      </div>

      {/* Recent Batches Section */}
      {recentBatches.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Batches</h2>
            <Link href="/batch">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {recentBatches.map((batch) => {
              const progress =
                batch.total_items > 0
                  ? ((batch.completed_items + batch.failed_items) / batch.total_items) * 100
                  : 0;

              const statusColors = {
                pending: 'bg-yellow-500',
                processing: 'bg-blue-500',
                completed: 'bg-green-500',
                failed: 'bg-red-500',
                cancelled: 'bg-gray-500',
              };

              return (
                <Link key={batch.id} href={`/batch/${batch.id}`}>
                  <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium truncate flex-1">{batch.name}</h3>
                      <Badge
                        className={`${statusColors[batch.status]} text-white text-xs`}
                      >
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {batch.total_items} items • {batch.credits_charged} credits
                    </div>
                    {batch.status === 'processing' && (
                      <div className="space-y-1">
                        <div className="w-full bg-muted rounded-full h-1.5">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {batch.completed_items} / {batch.total_items}
                        </div>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Images Section */}
      {images.length === 0 ? (
        <EmptyState
          title="No images yet"
          description="Generate your first professional product photo"
          actionLabel="Generate Image"
          actionHref="/generate"
        />
      ) : (
        <ImageGallery images={images} />
      )}
    </div>
  );
}
