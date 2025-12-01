// src/components/forms/prompt-input.tsx
'use client';

import { useState } from 'react';

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
      <label className="block text-sm font-medium text-gray-700">
        Generation Prompt
      </label>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={3}
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 disabled:bg-gray-100"
          placeholder="Describe how you want the product photo to look..."
        />

        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className="absolute right-2 bottom-2 text-xs text-blue-600 hover:text-blue-700"
        >
          Templates
        </button>
      </div>

      {showTemplates && (
        <div className="grid grid-cols-2 gap-2">
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.label}
              type="button"
              onClick={() => {
                onChange(template.prompt);
                setShowTemplates(false);
              }}
              className="text-left p-2 text-sm border rounded-md hover:bg-gray-50"
            >
              <span className="font-medium">{template.label}</span>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500">
        {value.length}/1000 characters
      </p>
    </div>
  );
}
