import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getUserGeneratedImages } from '@/lib/db/generated-images';
import { ImageGallery } from '@/components/image-gallery';
import { EmptyState } from '@/components/empty-state';
import Link from 'next/link';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const images = await getUserGeneratedImages(user.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Images</h1>
        <Link
          href="/generate"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Generate New
        </Link>
      </div>

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
