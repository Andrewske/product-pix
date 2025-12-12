import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface FinalCTASectionProps {
  className?: string;
}

export function FinalCTASection({ className = '' }: FinalCTASectionProps) {
  return (
    <section
      className={`py-24 px-4 sm:px-6 lg:px-8 bg-card border-t border-border/40 ${className}`}
      aria-labelledby="final-cta-heading"
      aria-describedby="final-cta-description"
    >
      <div className="max-w-4xl mx-auto text-center">
        <h2 id="final-cta-heading" className="text-4xl sm:text-5xl font-bold mb-6 font-display">
          Ready to upgrade your listings?
        </h2>
        <p id="final-cta-description" className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
          Join thousands of sellers creating professional product photos in seconds.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center" role="group" aria-label="Final call-to-action">
          <Link href="/signup" aria-describedby="final-cta-button-description">
            <Button
              size="lg"
              variant="accent"
              className="text-lg px-10 py-6 h-auto w-full sm:w-auto"
            >
              Get Started for Free
            </Button>
            <span id="final-cta-button-description" className="sr-only">
              Start your free trial with 5 credits, no credit card required
            </span>
          </Link>
        </div>
        <p className="mt-6 text-sm text-muted-foreground" aria-label="Free trial details">
          No credit card required • 5 free credits
        </p>
      </div>
    </section>
  );
}