'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Section {
  id: string;
  title: string;
}

interface TableOfContentsProps {
  sections: Section[];
  className?: string;
}

function TableOfContents({ sections, className }: TableOfContentsProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={cn('bg-card rounded-lg border p-4', className)}>
      <ol className="list-decimal list-inside space-y-2">
        {sections.map((section) => (
          <li key={section.id}>
            <a
              href={`#${section.id}`}
              onClick={(e) => handleClick(e, section.id)}
              className="text-foreground hover:underline transition-colors"
            >
              {section.title}
            </a>
          </li>
        ))}
      </ol>
    </div>
  );
}

export { TableOfContents };
export type { TableOfContentsProps, Section };