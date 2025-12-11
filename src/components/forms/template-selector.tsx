'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Check } from 'lucide-react';

interface Template {
  slug: string;
  version: number;
  name: string;
  description: string;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (templateSlug: string) => void;
  disabled?: boolean;
}

export function TemplateSelector({ value, onChange, disabled }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/templates');
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        const data = await response.json();
        setTemplates(data.templates);

        // Set default template if none selected
        if (!value && data.templates.length > 0) {
          onChange(data.templates[0].slug);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-2 text-sm text-muted-foreground">Loading templates...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No templates available
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        Select Template
      </label>
      <div className="grid grid-cols-1 gap-2">
        {templates.map((template) => (
          <Card
            key={template.slug}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              value === template.slug
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => !disabled && onChange(template.slug)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description}
                </p>
              </div>
              {value === template.slug && (
                <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
