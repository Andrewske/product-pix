import { AdminNav } from '@/components/admin/admin-nav';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        <AdminNav />
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}