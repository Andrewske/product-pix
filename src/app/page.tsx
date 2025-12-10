import { Metadata } from 'next';
import {
  HeroSection,
  ExamplesSection,
  HowItWorksSection,
  TrustStripSection,
  PricingSection,
  FinalCTASection,
  Footer
} from '@/components/landing';
import { getPricing } from '@/lib/pricing/actions';
import { landingConfig } from '@/lib/landing';

export const metadata: Metadata = {
  title: "ProductPix - Professional Product Photos in Seconds",
  description: "Transform your product photos into studio-quality images instantly with AI",
}

export default async function Home() {
  const pricing = await getPricing();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection example={landingConfig.examples[0]} />
      <ExamplesSection examples={landingConfig.examples} />
      <HowItWorksSection />
      <TrustStripSection />
      <PricingSection pricing={pricing} />
      <FinalCTASection />
      <Footer />
    </div>
  )
}
