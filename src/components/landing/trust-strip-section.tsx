import { Shield, FileCheck, RefreshCw, Clock, CreditCard } from 'lucide-react';

interface TrustStripSectionProps {
  className?: string;
}

const trustItems = [
  {
    icon: Shield,
    label: 'Powered by Google Gemini',
  },
  {
    icon: FileCheck,
    label: 'Commercial license',
  },
  {
    icon: RefreshCw,
    label: 'Instant refunds',
  },
  {
    icon: Clock,
    label: '30-day storage',
  },
  {
    icon: CreditCard,
    label: 'Secure payments',
  },
];

export function TrustStripSection({ className = '' }: TrustStripSectionProps): React.ReactElement {
  return (
    <section
      className={`py-12 px-4 sm:px-6 lg:px-8 border-y border-border/40 bg-card/30 ${className}`}
      aria-label="Trust and security features"
    >
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 lg:gap-16">
          {trustItems.map((item) => (
            <div
              key={item.label}
              className="flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
            >
              <item.icon
                className="w-5 h-5 text-primary flex-shrink-0"
                aria-hidden="true"
              />
              <span className="text-sm font-medium whitespace-nowrap">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
