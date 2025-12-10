import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BeforeAfterSlider } from '@/components/before-after-slider';
import { getPricing } from '@/lib/pricing/actions';

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
        url: 'https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png',
        width: 1200,
        height: 630,
        alt: 'ProductPix - Before and After Product Photo Enhancement',
      },
    ],
  },
};

// Example data from the plan
const examples = [
  {
    beforeImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/sources/ffb69068ef4b0e9511d6198bc12b0068fe65a5365c6339f22c3ec2cc1ce1222e.jpg",
    afterImage: "https://pub-76304578acde4439afba93b377f6b24c.r2.dev/prompt-tests/daa47d94-189d-4110-b29b-2ad91b220ddd.png",
    product: "Peanut Butter Jar",
    category: "Food/Consumer"
  }
];

export default async function LandingPage() {
  const pricing = await getPricing();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Professional Product Photos in Seconds
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Upload your product photo, get studio-quality results instantly. No design skills needed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/signup">
                <Button size="lg" className="text-lg px-8 py-3">
                  Get 5 Free Photos
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                See Examples
              </Button>
            </div>
          </div>

          <div className="flex justify-center">
            <BeforeAfterSlider {...examples[0]} />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Transform your product photos in three simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Upload</h3>
              <p className="text-muted-foreground">Drop your product photo</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Style (Optional)</h3>
              <p className="text-muted-foreground">Pick a template or use our default</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary-foreground">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Download</h3>
              <p className="text-muted-foreground">Get your professional photo</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Start free with 5 credits. Credits never expire. No subscriptions required.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {Object.values(pricing.packs).map((pack, index) => (
              <Card key={pack.slug} className={`p-6 ${index === 1 ? 'border-primary shadow-lg' : ''}`}>
                {index === 1 && (
                  <Badge className="mb-4 w-fit">Best Value</Badge>
                )}
                <h3 className="text-2xl font-bold mb-2">{pack.slug.replace('pack_', '').toUpperCase()} Credits</h3>
                <div className="text-3xl font-bold mb-4">
                  ${(pack.priceCents / 100).toFixed(2)}
                  <span className="text-lg font-normal text-muted-foreground">
                    ({pack.credits} credits)
                  </span>
                </div>
                <p className="text-muted-foreground mb-6">
                  ${((pack.priceCents / 100) / pack.credits).toFixed(3)} per photo
                </p>
                <Link href="/signup" className="w-full">
                  <Button className="w-full" variant={index === 1 ? 'default' : 'outline'}>
                    Get Started
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to upgrade your listings?
          </h2>
          <p className="text-xl mb-8 opacity-90">
            Get 5 free photos. No credit card required.
          </p>
          <Link href="/signup">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-3">
              Get Started Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-secondary/30 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center mb-4 md:mb-0">
              <span className="text-xl font-bold">ProductPix</span>
            </div>
            <nav className="flex flex-wrap justify-center md:justify-end gap-6 mb-4 md:mb-0">
              <Link href="/pricing" className="text-muted-foreground hover:text-foreground text-sm">
                Pricing
              </Link>
              <Link href="/login" className="text-muted-foreground hover:text-foreground text-sm">
                Login
              </Link>
              <Link href="/signup" className="text-muted-foreground hover:text-foreground text-sm">
                Sign Up
              </Link>
            </nav>
            <div className="flex gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                Privacy
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm">
                Contact
              </a>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} ProductPix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}