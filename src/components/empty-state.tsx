// src/components/empty-state.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="text-center py-16 relative">
      <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-3xl -z-10" />
      <svg
        className="mx-auto h-16 w-16 text-accent/70"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
      <h3 className="mt-6 text-2xl font-semibold tracking-tight">{title}</h3>
      <p className="mt-3 text-lg text-muted-foreground/80 max-w-md mx-auto leading-relaxed">{description}</p>
      <div className="mt-8">
        <Link href={actionHref}>
          <Button size="lg" variant="studio" className="px-8">{actionLabel}</Button>
        </Link>
      </div>
    </div>
  );
}
