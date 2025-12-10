import Link from 'next/link';
import { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BeforeAfterSlider } from '@/components/before-after-slider';
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
      {/* Hero Section */}
      <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-7xl opacity-20 pointer-events-none">
            <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-primary/20 blur-[120px] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Professional Product Photos <br className="hidden sm:block" />
              <span className="text-primary">in Seconds</span>
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              Transform phone photos into studio-quality product images. <br className="hidden sm:block" />
              No design skills needed. Perfect for e-commerce.
            </p>
             <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
               <Link href="/signup">
                 <Button size="lg" className="text-lg px-8 py-6 h-auto font-semibold shadow-lg shadow-primary/20">
                   Get 5 Free Photos
                 </Button>
               </Link>
               <Link href="#how-it-works">
                  <Button variant="ghost" size="lg" className="text-lg px-8 py-6 h-auto">
                    See how it works
                  </Button>
               </Link>
             </div>
          </div>

          <div className="flex justify-center max-w-4xl mx-auto">
            <div className="relative w-full aspect-square md:aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl bg-card">
                <BeforeAfterSlider {...landingConfig.examples[0]} />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 bg-muted/10 border-y border-border/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to professional results
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {[
              {
                step: 1,
                title: "Upload",
                description: "Drop your raw product photo directly from your phone.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                )
              },
              {
                step: 2,
                title: "Style",
                description: "Choose from our curated templates or describe your own scene.",
                icon: (
                   <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                )
              },
              {
                step: 3,
                title: "Download",
                description: "Get high-resolution, marketplace-ready images instantly.",
                icon: (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                )
              }
            ].map((item) => (
               <div key={item.step} className="relative group">
                <div className="absolute inset-0 bg-primary/5 rounded-3xl transform group-hover:scale-105 transition-transform duration-300" />
                <div className="relative p-8 text-center">
                  <div className="w-20 h-20 bg-background border border-primary/20 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg group-hover:border-primary/50 transition-colors">
                    <span className="text-primary">
                      {item.icon}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground leading-relaxed text-lg">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

       {/* Pricing Section */}
       <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-6">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free. Pay as you go. No subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
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
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-1 text-sm font-medium">
                        Best Value
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-muted-foreground mb-2">
                      {pack.slug.replace('pack_', '').toUpperCase()} Credits
                    </h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        ${(pack.priceCents / 100).toFixed(0)}
                      </span>
                      {pack.priceCents % 100 !== 0 && (
                        <span className="text-xl font-semibold">
                          .{(pack.priceCents % 100).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-primary font-medium">
                      {pack.credits} photos
                    </div>
                  </div>

                  <ul className="space-y-4 mb-8 flex-1">
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      ${((pack.priceCents / 100) / pack.credits).toFixed(2)} per photo
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Commercial license
                    </li>
                    <li className="flex items-center gap-3 text-muted-foreground">
                      <svg className="w-5 h-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Never expires
                    </li>
                  </ul>

                  <Link href="/signup" className="w-full">
                    <Button 
                      className="w-full" 
                      size="lg"
                      variant={isPopular ? 'default' : 'outline'}
                    >
                      Get Started
                    </Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card border-t border-border/40">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Ready to upgrade your listings?
          </h2>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            Join thousands of sellers creating professional product photos in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="text-lg px-10 py-6 h-auto w-full sm:w-auto">
                Get Started for Free
              </Button>
            </Link>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            No credit card required • 5 free credits
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-background py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center">
              <span className="text-xl font-bold">ProductPix</span>
            </div>
            
            <nav className="flex flex-wrap justify-center gap-8">
               <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
                 Pricing
               </a>
              <Link href="/login" className="text-muted-foreground hover:text-foreground transition-colors">
                Login
              </Link>
              <Link href="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
                Sign Up
              </Link>
            </nav>
            
            <div className="flex gap-8">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Terms
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
                Privacy
              </a>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-muted-foreground text-sm">
              &copy; {new Date().getFullYear()} ProductPix. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
