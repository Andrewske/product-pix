import { Button } from "@/components/ui/button"
import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { HeroSection } from "@/components/hero-section"
import { SectionHeader } from "@/components/section-header"
import { FeatureCard } from "@/components/feature-card"
import { ProcessStep } from "@/components/process-step"
import { GetStartedButton } from "@/components/get-started-button"
import { PricingSection } from "@/components/pricing-section"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "ProductPix - Professional Product Photos in Seconds",
  description: "Transform your product photos into studio-quality images instantly with AI",
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader />

      <HeroSection
        badge="AI-Powered Studio Photography"
        title={
          <>
            Professional Photos
            <br />
            <span className="text-primary">in Seconds</span>
          </>
        }
        description={
          <>
            Transform ordinary snapshots into high-end studio photography.
            <br />
            No equipment. No studio. Just perfect light.
          </>
        }
        primaryCta={
          <GetStartedButton size="lg" variant="default" showArrow>
            Start Creating Free
          </GetStartedButton>
        }
        secondaryCta={
          <Button size="lg" variant="outline">
            View Gallery
          </Button>
        }
        imageSrc="/hero-image.jpg"
        imageAlt="Professional product photography showcase"
      />

      <FeaturesSection />

      <HowItWorksSection />

      <PricingSection />

      <CTASection />

      <SiteFooter />
    </div>
  )
}

function FeaturesSection() {
  const features = [
    {
      title: "Wireless Headphones",
      description: "Electronics • Studio Dark",
      imageSrc: "/examples/headphones.jpg",
      badge: "After"
    },
    {
      title: "Ceramic Mug",
      description: "Home • Soft Morning",
      imageSrc: "/examples/mug.jpg",
      badge: "After"
    },
    {
      title: "Leather Wallet",
      description: "Fashion • High Contrast",
      imageSrc: "/examples/wallet.jpg",
      badge: "After"
    },
  ]

  return (
    <section id="features" className="w-full py-32 relative bg-background">
      <div className="max-w-6xl mx-auto px-4 relative">
        <SectionHeader
          title="Immaculate Results"
          description="From raw phone photos to commercial-grade assets instantly."
        />

         <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
           {features.map((feature) => (
             <FeatureCard
               key={feature.title}
               {...feature}
             />
           ))}
         </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const steps = [
    { title: "Upload", description: "Drag & drop your raw product shot." },
    { title: "Prompt", description: "Describe the scene or choose a preset." },
    { title: "Download", description: "Get 4K commercial-ready images." },
  ]

  return (
    <section id="how-it-works" className="w-full py-32 border-t border-border/40 relative">
      <div className="max-w-6xl mx-auto px-4 relative">
         <div className="grid md:grid-cols-2 gap-16 items-center max-w-5xl mx-auto">
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
              {steps.map((step, i) => (
                <ProcessStep
                  key={step.title}
                  step={i + 1}
                  title={step.title}
                  description={step.description}
                  isLast={i === steps.length - 1}
                />
              ))}
            </div>
          </div>

          {/* Keep existing process visualization */}
          <div className="relative aspect-square rounded-3xl bg-muted/20 flex items-center justify-center border border-border/40">
            <div className="text-center text-muted-foreground/40">
              <p className="text-sm font-medium">Process Visualization</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CTASection() {
  return (
    <section className="w-full py-32 text-center relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 relative z-10">
        <h2 className="text-5xl md:text-6xl font-bold mb-8 tracking-tight text-balance font-display">
          Ready to upgrade your listings?
        </h2>
        <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto font-light">
          Join thousands of e-commerce sellers transforming product photos in seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <GetStartedButton size="lg" variant="default">
            Get Started Free
          </GetStartedButton>
          <p className="text-sm text-muted-foreground sm:absolute sm:bottom-0 sm:translate-y-12">
            No credit card required • 5 free credits
          </p>
        </div>
      </div>
    </section>
  )
}
