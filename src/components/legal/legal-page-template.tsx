import * as React from 'react';
import Link from 'next/link';
import { PageContainer } from '@/components/layout/page-container';
import { TableOfContents } from '@/components/ui/table-of-contents';

export interface LegalSection {
  id: string;
  title: string;
  level: 1 | 2 | 3;
  content: React.ReactNode;
}

export interface LegalPageTemplateProps {
  title: string;
  sections: LegalSection[];
  footerLinks?: Array<{
    href: string;
    label: string;
  }>;
  lastUpdated?: string;
  className?: string;
}

function LegalPageTemplate({
  title,
  sections,
  footerLinks = [],
  lastUpdated,
  className
}: LegalPageTemplateProps): React.ReactElement {
  // Generate TOC sections from level 2 headings
  const tocSections = sections
    .filter(section => section.level === 2)
    .map(section => ({
      id: section.id,
      title: section.title
    }));

  const renderSection = (section: LegalSection) => {
    const baseClasses = "scroll-mt-8";

    switch (section.level) {
      case 1:
        return (
          <section key={section.id} id={section.id} className={baseClasses}>
            <h1 className="text-4xl font-bold tracking-tight mb-4 font-display">{section.title}</h1>
            {section.content}
          </section>
        );
      case 2:
        return (
          <section key={section.id} id={section.id} className={baseClasses}>
            <h2 className="text-2xl font-semibold mb-4 font-display">{section.title}</h2>
            {section.content}
          </section>
        );
      case 3:
        return (
          <section key={section.id} id={section.id} className={baseClasses}>
            <h3 className="text-xl font-medium mb-3 font-display">{section.title}</h3>
            {section.content}
          </section>
        );
      default: {
        const _exhaustiveCheck: never = section.level;
        throw new Error(`Unsupported section level: ${_exhaustiveCheck}`);
      }
    }
  };

  return (
    <PageContainer narrow className={className}>
      <article className="max-w-3xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight mb-4 font-display">{title}</h1>
          {lastUpdated && (
            <p className="text-muted-foreground">Last updated: {lastUpdated}</p>
          )}
        </header>

        {tocSections.length > 0 && (
          <TableOfContents sections={tocSections} className="mb-12" />
        )}

        <div className="space-y-10 text-foreground/90 leading-relaxed">
          {sections.map(renderSection)}
        </div>

        {footerLinks.length > 0 && (
          <footer className="mt-16 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground">
              See also:{' '}
              {footerLinks.map((link, index) => (
                <React.Fragment key={link.href}>
                  {index > 0 && ', '}
                  <Link href={link.href} className="text-accent hover:underline">
                    {link.label}
                  </Link>
                </React.Fragment>
              ))}
            </p>
          </footer>
        )}
      </article>
    </PageContainer>
  );
}

export { LegalPageTemplate };