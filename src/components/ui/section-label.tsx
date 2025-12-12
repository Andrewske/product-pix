// src/components/ui/section-label.tsx
import { cn } from '@/lib/utils';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionLabel({ children, className }: SectionLabelProps) {
  return (
    <span className={cn(
      'text-xs font-medium uppercase tracking-wide text-muted-foreground mb-3 block',
      className
    )}>
      {children}
    </span>
  );
}