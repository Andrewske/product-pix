import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PricingPack {
  slug: string;
  priceCents: number;
  credits: number;
}

interface PricingData {
  packs: Record<string, PricingPack>;
}

interface PricingSectionProps {
  pricing: PricingData;
  className?: string;
}

export function PricingSection({ pricing, className = '' }: PricingSectionProps) {
  return (
    <section
      id="pricing"
      className={`py-24 px-4 sm:px-6 lg:px-8 ${className}`}
      aria-labelledby="pricing-heading"
      aria-describedby="pricing-description"
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 id="pricing-heading" className="text-3xl sm:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
          <p id="pricing-description" className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start free. Pay as you go. No subscriptions.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto" role="grid" aria-label="Pricing plans">
          {Object.values(pricing.packs).map((pack, index) => {
            const isPopular = index === 1;
            return (
              <Card
                key={pack.slug}
                className={`relative p-8 flex flex-col ${
                  isPopular
                    ? 'border-primary shadow-2xl shadow-primary/10 scale-105 z-10'
                    : 'border-border bg-card/50'
                }`}
                role="gridcell"
                aria-labelledby={`plan-${pack.slug}-title`}
                aria-describedby={`plan-${pack.slug}-price plan-${pack.slug}-features`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2" aria-hidden="true">
                    <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium">
                      Best Value
                    </Badge>
                  </div>
                )}

                <div className="mb-8">
                  <h3 id={`plan-${pack.slug}-title`} className="text-lg font-medium text-muted-foreground mb-2">
                    {pack.slug.replace('pack_', '').toUpperCase()} Credits
                  </h3>
                  <div className="flex items-baseline gap-1" id={`plan-${pack.slug}-price`}>
                    <span className="text-4xl font-bold" aria-label={`${pack.priceCents / 100} dollars`}>
                      ${(pack.priceCents / 100).toFixed(0)}
                    </span>
                    {pack.priceCents % 100 !== 0 && (
                      <span className="text-xl font-semibold" aria-hidden="true">
                        .{(pack.priceCents % 100).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-primary font-medium" aria-label={`${pack.credits} photo credits included`}>
                    {pack.credits} photos
                  </div>
                </div>

                <ul id={`plan-${pack.slug}-features`} className="space-y-4 mb-8 flex-1" role="list">
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <svg
                      className="w-5 h-5 text-success flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                      role="img"
                      aria-label="Included feature"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>${((pack.priceCents / 100) / pack.credits).toFixed(2)} per photo</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <svg
                      className="w-5 h-5 text-success flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                      role="img"
                      aria-label="Included feature"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Commercial license</span>
                  </li>
                  <li className="flex items-center gap-3 text-muted-foreground">
                    <svg
                      className="w-5 h-5 text-success flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                      role="img"
                      aria-label="Included feature"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>Never expires</span>
                  </li>
                </ul>

                <Link href="/signup" className="w-full">
                  <Button
                    className="w-full"
                    size="lg"
                    variant={isPopular ? 'default' : 'outline'}
                    aria-describedby={`plan-${pack.slug}-cta-description`}
                  >
                    Get Started
                  </Button>
                  <span id={`plan-${pack.slug}-cta-description`} className="sr-only">
                    Purchase {pack.slug.replace('pack_', '')} credits for ${(pack.priceCents / 100).toFixed(2)}
                  </span>
                </Link>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}