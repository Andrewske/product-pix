import { AdminNav } from '@/components/admin/admin-nav';
import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): React.JSX.Element {
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