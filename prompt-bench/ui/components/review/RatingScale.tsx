import * as React from 'react';
import { Button, cn } from '../primitives';

interface RatingScaleProps {
  value: number | null;
  onChange: (rating: number) => void;
  disabled?: boolean;
}

export function RatingScale({ value, onChange, disabled }: RatingScaleProps): React.ReactElement {
  const [hoveredValue, setHoveredValue] = React.useState<number | null>(null);

  const getButtonColor = (rating: number): string => {
    const displayValue = hoveredValue !== null ? hoveredValue : value;
    const isSelected = displayValue !== null && rating <= displayValue;

    if (isSelected) {
      if (rating >= 8) return 'bg-green-500 text-white border-green-600';
      if (rating >= 5) return 'bg-yellow-500 text-white border-yellow-600';
      return 'bg-red-500 text-white border-red-600';
    }

    // Hover preview colors
    if (hoveredValue !== null && rating <= hoveredValue) {
      if (rating >= 8) return 'bg-green-200 text-green-800 border-green-300';
      if (rating >= 5) return 'bg-yellow-200 text-yellow-800 border-yellow-300';
      return 'bg-red-200 text-red-800 border-red-300';
    }

    return 'bg-background text-muted-foreground border-border hover:border-foreground/30';
  };

  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
        <Button
          key={rating}
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => onChange(rating)}
          onMouseEnter={() => setHoveredValue(rating)}
          onMouseLeave={() => setHoveredValue(null)}
          className={cn(
            'w-10 h-10 font-bold transition-all',
            getButtonColor(rating)
          )}
        >
          {rating}
        </Button>
      ))}
    </div>
  );
}
