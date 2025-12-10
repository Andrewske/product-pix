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

  const statusStyles = {
    pending: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border-yellow-500/20',
    processing: 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20',
    completed: 'bg-success/10 text-success hover:bg-success/20 border-success/20',
    failed: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20',
    cancelled: 'bg-muted text-muted-foreground hover:bg-muted/80',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <h1 className="text-3xl font-bold tracking-tight">Your Images</h1>
        <div className="flex gap-3 w-full sm:w-auto">
          <Link href="/batch/new" className="flex-1 sm:flex-none">
            <Button variant="outline" className="w-full">Create Batch</Button>
          </Link>
          <Link href="/generate" className="flex-1 sm:flex-none">
            <Button className="w-full">Generate New</Button>
          </Link>
        </div>
      </div>

      {/* Recent Batches Section */}
      {recentBatches.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Batches</h2>
            <Link href="/batch">
              <Button variant="ghost" size="sm" className="text-muted-foreground">View All</Button>
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {recentBatches.map((batch) => {
              const progress =
                batch.total_items > 0
                  ? ((batch.completed_items + batch.failed_items) / batch.total_items) * 100
                  : 0;

              return (
                <Link key={batch.id} href={`/batch/${batch.id}`}>
                  <Card className="p-6 hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 bg-card hover:border-primary/50">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold truncate flex-1 pr-4">{batch.name}</h3>
                      <Badge
                        variant="outline"
                        className={`${statusStyles[batch.status as keyof typeof statusStyles]} border`}
                      >
                        {batch.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium text-foreground">{batch.total_items}</span> items • <span className="font-medium text-foreground">{batch.credits_charged}</span> credits
                    </div>
                    {batch.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-1.5 rounded-full transition-all duration-500 ease-out"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Processing...</span>
                          <span>{batch.completed_items} / {batch.total_items}</span>
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
