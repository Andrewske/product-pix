// src/components/generation-loading.tsx
import { Spinner } from './ui/spinner';

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
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <Spinner size="lg" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
