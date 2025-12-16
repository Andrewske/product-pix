// src/components/generation-loading.tsx
import { Spinner } from './ui/spinner';
import { Card } from './ui/card';

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
  const useTeal = stage % 2 === 1; // Alternate between green and teal

  return (
    <Card  className="p-8">
      <div className="flex flex-col items-center justify-center space-y-6">
        <div className="relative">
          <div className={useTeal 
            ? "absolute inset-0 rounded-full bg-teal/30 animate-pulse" 
            : "absolute inset-0 rounded-full bg-accent/30 animate-pulse"} />
          <Spinner size="lg" variant={useTeal ? "teal" : "default"} className="relative z-10" />
        </div>
        <p className="text-center text-accent/90">{message}</p>
      </div>
    </Card>
  );
}
