import { Metadata } from 'next';
import {
  HeroSection,
  ExamplesSection,
  HowItWorksSection,
  PricingSection,
  FinalCTASection,
  Footer
} from '@/components/landing';
import { getPricing } from '@/lib/pricing/actions';
import { landingConfig } from '@/lib/landing';

export const metadata: Metadata = {
  title: 'ProductPix - Professional Product Photos in Seconds',
  description: 'Transform phone photos into studio-quality product images. Perfect for Poshmark, eBay, and Etsy sellers. Get 5 free photos.',
  keywords: 'product photography, AI photo enhancement, e-commerce photos, Poshmark, eBay, Etsy',
  openGraph: {
    title: 'ProductPix - Professional Product Photos in Seconds',
    description: 'Transform phone photos into studio-quality product images. Perfect for Poshmark, eBay, and Etsy sellers. Get 5 free photos.',
    type: 'website',
    images: [
      {
        url: landingConfig.openGraphImage,
        width: 1200,
        height: 630,
        alt: 'ProductPix - Before and After Product Photo Enhancement',
      },
    ],
  },
};

export default async function LandingPage() {
  const pricing = await getPricing();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <HeroSection example={landingConfig.examples[0]} />
      <ExamplesSection examples={landingConfig.examples} />
      <HowItWorksSection />
      <PricingSection pricing={pricing} />
      <FinalCTASection />
      <Footer />
    </div>
  );
}
