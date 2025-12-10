'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string;
}

interface TemplateSelectorProps {
  value: string;
  onChange: (templateId: string) => void;
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
          onChange(data.templates[0].id);
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
      <div className="text-sm text-muted-foreground">
        Loading templates...
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
            key={template.id}
            className={`p-4 cursor-pointer transition-all hover:border-primary ${
              value === template.id
                ? 'border-primary bg-primary/5'
                : 'border-border'
            }`}
            onClick={() => !disabled && onChange(template.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="font-medium text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {template.description}
                </p>
              </div>
              {value === template.id && (
                <Check className="h-4 w-4 text-primary flex-shrink-0 ml-2" />
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
