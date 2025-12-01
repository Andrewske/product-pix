// src/components/forms/prompt-input.tsx
'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PROMPT_TEMPLATES = [
  {
    label: 'White Background',
    prompt: 'Professional product photo on clean white background with soft shadows',
  },
  {
    label: 'Lifestyle',
    prompt: 'Product in a lifestyle setting, natural lighting, modern home environment',
  },
  {
    label: 'Studio',
    prompt: 'Studio product photography with professional lighting, gradient background',
  },
  {
    label: 'Minimal',
    prompt: 'Minimalist product photo, solid color background, sharp focus',
  },
];

export function PromptInput({ value, onChange, disabled }: PromptInputProps) {
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Generation Prompt
      </label>

      <div className="relative">
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          placeholder="Describe how you want the product photo to look..."
        />

        <Button
          type="button"
          size="sm"
          variant="link"
          onClick={() => setShowTemplates(!showTemplates)}
          className="absolute right-2 bottom-2 text-xs"
        >
          Templates
        </Button>
      </div>

      {showTemplates && (
        <div className="grid grid-cols-2 gap-2">
          {PROMPT_TEMPLATES.map((template) => (
            <Button
              key={template.label}
              type="button"
              variant="outline"
              onClick={() => {
                onChange(template.prompt);
                setShowTemplates(false);
              }}
              className="text-left justify-start h-auto py-2"
            >
              <span className="font-medium">{template.label}</span>
            </Button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {value.length}/1000 characters
      </p>
    </div>
  );
}
