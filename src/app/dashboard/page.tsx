import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserGeneratedImages } from '@/lib/db/generated-images';
import { getUserBatches } from '@/lib/db/batch';
import { ImageGallery } from '@/components/image-gallery';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { PageContainer } from '@/components/layout/page-container';
import { SectionHeader } from '@/components/ui/section-header';
import { Card } from '@/components/ui/card';
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
    <PageContainer spotlight>
      <SectionHeader
        title="Your Images"
        className="text-left mb-12"
      />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
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
        <div className="py-32">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Recent Batches</h2>
            <Link href="/batch">
              <Button variant="ghost" size="sm" className="text-info hover:text-info/80">View All</Button>
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
                  <Card variant="studio" hover className="p-6 cursor-pointer">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="font-semibold truncate flex-1 pr-4">{batch.name}</h3>
                      <StatusBadge status={batch.status}>
                        {batch.status}
                      </StatusBadge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-4">
                      <span className="font-medium text-foreground">{batch.total_items}</span> items • <span className="font-medium text-foreground">{batch.credits_charged}</span> credits
                    </div>
                    {batch.status === 'processing' && (
                      <div className="space-y-2">
                        <div className="w-full bg-accent/20 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-accent h-1.5 rounded-full transition-all duration-500 ease-out"
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
      <div className="py-32">
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
    </PageContainer>
  );
}
