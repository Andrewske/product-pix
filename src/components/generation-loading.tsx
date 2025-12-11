// src/components/generation-loading.tsx
import { Spinner } from './ui/spinner';
import { StudioCard } from './ui/studio-card';

const GENERATION_MESSAGES = [
  'Analyzing your product...',
  'Enhancing lighting and shadows...',
  'Generating professional background...',
  'Applying finishing touches...',
  'Almost there...',
];

interface GenerationLoadingProps {
  stage?: number;
}

export function GenerationLoading({ stage = 0 }: GenerationLoadingProps) {
  const message = GENERATION_MESSAGES[stage % GENERATION_MESSAGES.length];

  return (
    <StudioCard className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className="absolute inset-0 rounded-full bg-accent/20 animate-pulse" />
          <Spinner className="size-8 relative z-10" />
        </div>
        <p className="text-muted-foreground text-center">{message}</p>
      </div>
    </StudioCard>
  );
}
