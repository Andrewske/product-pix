 import { Button } from "@/components/ui/button"
 import { Card } from "@/components/ui/card"
 import { ArrowRight, ImageIcon, Sparkles, ArrowUpRight } from "lucide-react"
 import { Metadata } from "next"
 import Image from "next/image"
 import { PricingSection } from "../components/pricing-section"
 import { GetStartedButton } from "@/components/get-started-button"

export const metadata: Metadata = {
  title: "ProductPix - Professional Product Photos in Seconds",
  description: "Transform your product photos into studio-quality images instantly with AI",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border/40 sticky top-0 z-50 bg-background/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent/60 rounded-lg flex items-center justify-center shadow-lg shadow-accent/20">
              <Sparkles className="w-5 h-5 text-accent-foreground" />
            </div>
            ProductPix
          </div>
          <nav className="flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Gallery
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Pricing
            </a>
              <GetStartedButton variant="default">
                Get Started
              </GetStartedButton>
          </nav>
        </div>
      </header>

       {/* Hero Section - Studio Stage */}
       <section className="w-full relative overflow-hidden py-32 bg-background">
         {/* Subtle background gradient - shadcn approach */}
         <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-accent/20 bg-accent/5 backdrop-blur-sm text-sm font-medium text-accent shadow-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>AI-Powered Studio Photography</span>
              </div>
              
               <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none text-balance font-display">
                 Professional Photos
                 <br />
                 <span className="text-primary">in Seconds</span>
               </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Transform ordinary snapshots into high-end studio photography.
                <br />
                No equipment. No studio. Just perfect light.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
               <GetStartedButton
                 size="lg"
                 variant="default"
                 showArrow
               >
                 Start Creating Free
               </GetStartedButton>
               <Button
                 size="lg"
                 variant="outline"
               >
                 View Gallery
               </Button>
            </div>

           {/* Hero Image Showcase */}
           <div className="mt-16 flex justify-center">
             <div className="relative w-full max-w-4xl aspect-video rounded-2xl overflow-hidden border border-border/50 shadow-2xl">
               <Image
                 src="/hero-image.jpg"
                 alt="Professional product photography showcase"
                 fill
                 className="object-cover"
                 priority
               />
             </div>
           </div>
          </div>
        </div>
      </section>

      {/* Transformation Gallery */}
      <section id="features" className="w-full py-32 relative bg-background">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-bold mb-6 tracking-tight font-display">Immaculate Results</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              From raw phone photos to commercial-grade assets instantly.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { title: "Wireless Headphones", desc: "Electronics • Studio Dark", accent: "green" },
              { title: "Ceramic Mug", desc: "Home • Soft Morning", accent: "teal" },
              { title: "Leather Wallet", desc: "Fashion • High Contrast", accent: "green" },
            ].map((item) => (
               <div key={item.title} className="group cursor-pointer">
                 <Card className="rounded-2xl overflow-hidden mb-6 aspect-[4/5] flex items-center justify-center relative hover:border-primary/50 transition-colors">
                  <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-background/80 backdrop-blur text-xs font-medium px-3 py-1 rounded-full border border-border flex items-center gap-1">
                      After <ArrowUpRight className="w-3 h-3" />
                    </div>
                  </div>

                   <div className="text-center">
                     <div className="w-32 h-32 bg-muted/20 rounded-lg flex items-center justify-center mb-2">
                        <ImageIcon className="w-12 h-12 text-muted-foreground/20" />
                     </div>
                   </div>
                 </Card>
                <h3 className="text-lg font-semibold mb-1 group-hover:text-accent transition-colors">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Simplified */}
      <section id="how-it-works" className="w-full py-32 border-t border-border/40 relative">
        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight font-display">
                The Virtual
                <br />
                Photo Studio
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Forget booking photographers, renting studios, or learning complex software.
                ProductPix gives you a full production team in your browser.
              </p>

              <div className="space-y-6 pt-4">
                {[
                  { title: "Upload", desc: "Drag & drop your raw product shot." },
                  { title: "Prompt", desc: "Describe the scene or choose a preset." },
                  { title: "Download", desc: "Get 4K commercial-ready images." },
                ].map((step, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="w-8 h-8 rounded-full border border-border flex items-center justify-center shrink-0 text-sm font-medium text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{step.title}</h3>
                      <p className="text-muted-foreground">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="aspect-square rounded-2xl bg-gradient-to-br from-card to-background border border-border/50 shadow-2xl flex items-center justify-center p-12 relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.05),transparent)]" />
                <div className="grid grid-cols-2 gap-4 w-full h-full opacity-50">
                   <div className="bg-muted/10 rounded-lg" />
                   <div className="bg-muted/10 rounded-lg" />
                   <div className="bg-muted/10 rounded-lg" />
                   <div className="bg-muted/10 rounded-lg" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-background/50 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl text-center">
                    <Sparkles className="w-12 h-12 text-foreground mx-auto mb-4" />
                    <div className="text-sm font-medium">Processing...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

       {/* Pricing - Minimalist Cards */}
       <PricingSection />

      {/* CTA - Clean & Direct */}
      <section className="w-full py-32 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight text-balance font-display">
            Ready to upgrade your listings?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
            Join thousands of e-commerce sellers transforming product photos in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
             <GetStartedButton
               size="lg"
               variant="default"
             >
               Get Started Free
             </GetStartedButton>
            <p className="text-sm text-muted-foreground sm:absolute sm:bottom-0 sm:translate-y-12">
              No credit card required • 5 free credits
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-foreground rounded-md" />
                ProductPix
              </h3>
              <p className="text-muted-foreground max-w-xs">
                AI-powered product photography for the modern e-commerce brand.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider text-foreground/80">Product</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider text-foreground/80">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-accent transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-accent transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
            <p>© 2025 ProductPix. All rights reserved.</p>
            <div className="flex gap-6">
              <span>Made with AI</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
