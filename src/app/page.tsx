<<<<<<< HEAD
import { Button } from "@/components/ui/button"
import { ArrowRight, Zap, ImageIcon, Download, Sparkles, ArrowUpRight } from "lucide-react"
import { Metadata } from "next"
import Image from "next/image"

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
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Gallery
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </a>
            <Button className="bg-foreground text-background hover:bg-foreground/90 transition-all shadow-lg hover:shadow-xl">
              Get Started
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section - Studio Stage */}
      <section className="w-full relative overflow-hidden py-32 bg-background">
        {/* Studio Lighting Effects */}
        <div className="absolute inset-0 studio-spotlight pointer-events-none" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[1200px] h-[600px] bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative z-10">
          <div className="text-center space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border bg-card/50 backdrop-blur-sm text-sm font-medium text-muted-foreground shadow-sm">
                <Sparkles className="w-4 h-4 text-accent" />
                <span>AI-Powered Studio Photography</span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-bold tracking-tight leading-none text-balance">
                Professional Photos
                <br />
                <span className="gradient-text-studio">in Seconds</span>
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
                Transform ordinary snapshots into high-end studio photography.
                <br />
                No equipment. No studio. Just perfect light.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button
                size="lg"
                className="bg-foreground text-background hover:bg-foreground/90 h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all button-studio"
              >
                Start Creating Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-border hover:bg-muted/50 transition-all"
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
            <h2 className="text-4xl font-bold mb-6 tracking-tight">Immaculate Results</h2>
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
                <div className="matte-card rounded-2xl overflow-hidden mb-6 aspect-[4/5] flex items-center justify-center relative matte-card-hover">
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
                </div>
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
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
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
      <section id="pricing" className="w-full py-32 relative">
        <div className="absolute inset-0 bg-muted/5 skew-y-3 transform origin-bottom-right pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 relative">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-bold mb-6">Simple Pricing</h2>
            <p className="text-muted-foreground">Pay per shoot. No monthly commitments.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              { credits: "50", price: "$5", costPerPhoto: "$0.10", label: "Starter" },
              { credits: "300", price: "$15", costPerPhoto: "$0.05", featured: true, label: "Professional" },
              { credits: "900", price: "$30", costPerPhoto: "$0.03", label: "Agency" },
            ].map((plan) => (
              <div
                key={plan.credits}
                className={`rounded-2xl p-8 transition-all duration-300 ${
                  plan.featured
                    ? "bg-foreground text-background shadow-2xl scale-105 z-10"
                    : "bg-card border border-border/50 text-foreground hover:border-foreground/20"
                }`}
              >
                <div className="mb-8">
                  <h3 className={`text-sm font-medium uppercase tracking-wider mb-2 ${plan.featured ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.label}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">{plan.price}</span>
                  </div>
                  <p className={`text-sm mt-2 ${plan.featured ? "text-background/70" : "text-muted-foreground"}`}>
                    {plan.credits} Credits • {plan.costPerPhoto}/photo
                  </p>
                </div>

                <ul className="space-y-4 mb-8 text-sm">
                  <li className="flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Commercial License
                  </li>
                  <li className="flex items-center gap-2">
                    <Download className="w-4 h-4" /> Full Resolution
                  </li>
                  <li className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4" /> 30-day Storage
                  </li>
                </ul>

                <Button
                  className={`w-full h-12 ${
                    plan.featured
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                  variant={plan.featured ? "secondary" : "default"}
                >
                  Get Credits
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Clean & Direct */}
      <section className="w-full py-32 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 relative z-10">
          <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight text-balance">
            Ready to upgrade your listings?
          </h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
            Join thousands of e-commerce sellers transforming product photos in seconds.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-foreground text-background hover:bg-foreground/90 h-14 px-10 text-lg shadow-xl button-studio"
            >
              Get Started Free
            </Button>
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
                <li><a href="#" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Showcase</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Login</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-6 uppercase tracking-wider text-foreground/80">Legal</h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Terms</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
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
