'use client';

import { cn } from '@/lib/utils';

interface AuthDividerProps {
  text?: string;
  className?: string;
}

export function AuthDivider({ text = 'Or continue with email', className }: AuthDividerProps): React.ReactElement {
  return (
    <div role="separator" aria-label={text.toLowerCase()} className={cn('relative flex items-center', className)}>
      <div className="flex-grow border-t border-border" />
      <span className="px-4 text-sm text-muted-foreground bg-background">{text}</span>
      <div className="flex-grow border-t border-border" />
    </div>
  );
}