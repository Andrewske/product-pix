import Image from 'next/image';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';

interface FooterLink {
  label: string;
  href: string;
  description?: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface SiteFooterProps {
  brand?: {
    logo?: string;
    name?: string;
    tagline?: string;
  };
  sections?: FooterSection[];
  legalLinks?: FooterLink[];
  copyright?: {
    text?: string;
    showYear?: boolean;
  };
}

const defaultBrand = {
  logo: '/placeholder-logo.svg',
  name: 'ProductPix',
  tagline: 'Professional Product Photos in Seconds',
};

const defaultSections: FooterSection[] = [
  {
    title: 'Product',
    links: [
      { label: 'Features', href: '#features', description: 'Explore our AI photo generation features' },
      { label: 'Pricing', href: '#pricing', description: 'View pricing plans and packages' },
      { label: 'Templates', href: '/templates', description: 'Browse available photo templates' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about', description: 'Learn about our mission and team' },
      { label: 'Blog', href: '/blog', description: 'Read our latest updates and tips' },
      { label: 'Contact', href: '/contact', description: 'Get in touch with our team' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', href: '/help', description: 'Find answers to common questions' },
      { label: 'API Docs', href: '/docs', description: 'Technical documentation for developers' },
      { label: 'Status', href: '/status', description: 'Check system status and uptime' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy Policy', href: '/privacy', description: 'Read our privacy policy' },
      { label: 'Terms of Service', href: '/terms', description: 'Read our terms of service' },
      { label: 'Cookie Policy', href: '/cookies', description: 'Learn about our cookie usage' },
    ],
  },
];

const defaultLegalLinks: FooterLink[] = [
  { label: 'Privacy', href: '/privacy', description: 'Read our privacy policy' },
  { label: 'Terms', href: '/terms', description: 'Read our terms of service' },
];

const defaultCopyright = {
  text: 'ProductPix. All rights reserved.',
  showYear: true,
};

export function SiteFooter({
  brand = defaultBrand,
  sections = defaultSections,
  legalLinks = defaultLegalLinks,
  copyright = defaultCopyright,
}: SiteFooterProps): React.ReactElement {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              {brand.logo && (
                <Image
                  src={brand.logo}
                  alt={`${brand.name} logo`}
                  width={32}
                  height={32}
                  className="h-8 w-8"
                />
              )}
              {brand.name && (
                <span className="text-xl font-bold">
                  {brand.name}
                </span>
              )}
            </div>
            {brand.tagline && (
              <p className="text-sm text-muted-foreground">
                {brand.tagline}
              </p>
            )}
          </div>

          {/* Footer Sections */}
          {sections.map((section) => (
            <div key={section.title} className="flex flex-col gap-4">
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <nav aria-label={`${section.title} navigation`}>
                <ul className="flex flex-col gap-3">
                  {section.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                        aria-describedby={link.description ? `${link.label.toLowerCase().replace(/\s+/g, '-')}-description` : undefined}
                      >
                        {link.label}
                      </Link>
                      {link.description && (
                        <span
                          id={`${link.label.toLowerCase().replace(/\s+/g, '-')}-description`}
                          className="sr-only"
                        >
                          {link.description}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          ))}
        </div>

        {/* Separator */}
        <Separator className="my-8" />

        {/* Footer Bottom */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          {/* Copyright */}
          <p className="text-sm text-muted-foreground">
            &copy; {copyright.showYear ? `${currentYear} ` : ''}{copyright.text}
          </p>

          {/* Legal Links */}
          <nav aria-label="Legal information">
            <ul className="flex flex-wrap gap-6">
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-sm px-2 py-1"
                    aria-describedby={link.description ? `${link.label.toLowerCase().replace(/\s+/g, '-')}-description` : undefined}
                  >
                    {link.label}
                  </Link>
                  {link.description && (
                    <span
                      id={`${link.label.toLowerCase().replace(/\s+/g, '-')}-description`}
                      className="sr-only"
                    >
                      {link.description}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}