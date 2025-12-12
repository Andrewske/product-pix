'use client';

import { useEffect, useState } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

interface Template {
  slug: string;
  version: number;
  name: string;
  description: string;
  icon: string;
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
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, []);

  // Set default template when templates load and no value is selected
  useEffect(() => {
    if (!loading && !error && templates.length > 0 && !value) {
      onChange(templates[0].slug);
    }
  }, [loading, error, templates, value, onChange]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Spinner size="md" />
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
    <div className="grid grid-cols-2 gap-3">
      {templates.map((template) => (
        <button
          key={template.slug}
          type="button"
          disabled={disabled}
          onClick={() => onChange(template.slug)}
          className={cn(
            'p-4 rounded-lg border text-left transition-all',
            value === template.slug
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          )}
        >
          <span className="text-2xl mb-2 block">{template.icon}</span>
          <span className="font-medium text-sm">{template.name}</span>
        </button>
      ))}
    </div>
  );
}
